const { logInfo, logError, logWarn } = require('../utils/logger');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Data Protection Monitoring System
 * Monitors for suspicious user deletion activities and sends alerts
 */

class DataProtectionMonitor {
  constructor() {
    this.alertThresholds = {
      maxDeletionsPerHour: 5,
      maxDeletionsPerDay: 20,
      suspiciousPatterns: [
        /@gmail\.com$/,
        /@yahoo\.com$/,
        /@hotmail\.com$/,
        /@outlook\.com$/
      ]
    };
    
    this.deletionLog = new Map(); // Track deletions by hour/day
    this.setupMonitoring();
  }

  /**
   * Setup monitoring for user deletions
   */
  setupMonitoring() {
    // Monitor User model for deletions
    const originalDeleteMany = User.deleteMany;
    const originalDeleteOne = User.deleteOne;
    const originalFindByIdAndDelete = User.findByIdAndDelete;

    // Wrap deleteMany
    User.deleteMany = async function(filter, options) {
      const result = await originalDeleteMany.call(this, filter, options);
      
      if (result.deletedCount > 0) {
        await DataProtectionMonitor.instance.logDeletion({
          operation: 'deleteMany',
          filter,
          deletedCount: result.deletedCount,
          options
        });
      }
      
      return result;
    };

    // Wrap deleteOne
    User.deleteOne = async function(filter, options) {
      const result = await originalDeleteOne.call(this, filter, options);
      
      if (result.deletedCount > 0) {
        await DataProtectionMonitor.instance.logDeletion({
          operation: 'deleteOne',
          filter,
          deletedCount: result.deletedCount,
          options
        });
      }
      
      return result;
    };

    // Wrap findByIdAndDelete
    User.findByIdAndDelete = async function(id, options) {
      const result = await originalFindByIdAndDelete.call(this, id, options);
      
      if (result) {
        await DataProtectionMonitor.instance.logDeletion({
          operation: 'findByIdAndDelete',
          id,
          deletedCount: 1,
          options
        });
      }
      
      return result;
    };

    // Set up periodic monitoring
    setInterval(() => {
      this.checkDeletionPatterns();
    }, 60 * 60 * 1000); // Check every hour

    logInfo('🛡️ Data Protection Monitor initialized');
  }

  /**
   * Log a deletion operation
   */
  async logDeletion(details) {
    try {
      const timestamp = new Date();
      const hourKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
      const dayKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`;

      // Track deletion counts
      this.deletionLog.set(hourKey, (this.deletionLog.get(hourKey) || 0) + details.deletedCount);
      this.deletionLog.set(dayKey, (this.deletionLog.get(dayKey) || 0) + details.deletedCount);

      // Get user details if possible
      let userDetails = [];
      if (details.filter && details.filter._id) {
        const users = await User.find(details.filter).limit(10);
        userDetails = users.map(u => ({ email: u.email, name: u.name, id: u._id }));
      }

      const logEntry = {
        timestamp,
        operation: details.operation,
        deletedCount: details.deletedCount,
        filter: details.filter,
        userDetails,
        environment: process.env.NODE_ENV,
        processId: process.pid,
        stackTrace: new Error().stack
      };

      // Log the deletion
      logWarn('🚨 USER DELETION DETECTED', logEntry);

      // Check if this is suspicious
      await this.checkSuspiciousActivity(logEntry);

      // Send immediate alert for any deletion
      await this.sendAlert('USER_DELETION', logEntry);

    } catch (error) {
      logError('Error logging deletion:', error);
    }
  }

  /**
   * Check for suspicious deletion patterns
   */
  async checkSuspiciousActivity(logEntry) {
    const isSuspicious = {
      reason: null,
      severity: 'low'
    };

    // Check for real email domains
    if (logEntry.userDetails && logEntry.userDetails.length > 0) {
      const realEmailDomains = logEntry.userDetails.some(user => 
        this.alertThresholds.suspiciousPatterns.some(pattern => 
          pattern.test(user.email)
        )
      );

      if (realEmailDomains) {
        isSuspicious.reason = 'Real email domains detected in deletion';
        isSuspicious.severity = 'critical';
      }
    }

    // Check deletion volume
    const timestamp = new Date();
    const hourKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
    const dayKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`;

    const hourlyDeletions = this.deletionLog.get(hourKey) || 0;
    const dailyDeletions = this.deletionLog.get(dayKey) || 0;

    if (hourlyDeletions > this.alertThresholds.maxDeletionsPerHour) {
      isSuspicious.reason = `High deletion volume: ${hourlyDeletions} users in 1 hour`;
      isSuspicious.severity = 'high';
    }

    if (dailyDeletions > this.alertThresholds.maxDeletionsPerDay) {
      isSuspicious.reason = `Very high deletion volume: ${dailyDeletions} users in 1 day`;
      isSuspicious.severity = 'critical';
    }

    // Check for bulk deletion patterns
    if (logEntry.deletedCount > 10) {
      isSuspicious.reason = `Bulk deletion detected: ${logEntry.deletedCount} users`;
      isSuspicious.severity = 'high';
    }

    if (isSuspicious.reason) {
      await this.sendAlert('SUSPICIOUS_DELETION', {
        ...logEntry,
        suspicious: isSuspicious
      });
    }
  }

  /**
   * Send alert about deletion activity
   */
  async sendAlert(type, details) {
    try {
      const alert = {
        type,
        timestamp: new Date(),
        severity: details.suspicious?.severity || 'medium',
        details,
        environment: process.env.NODE_ENV,
        server: process.env.HOSTNAME || 'unknown'
      };

      // Log the alert
      logError(`🚨 DATA PROTECTION ALERT: ${type}`, alert);

      // Send email alert (if email service is configured)
      if (process.env.ALERT_EMAIL) {
        await this.sendEmailAlert(alert);
      }

      // Send to monitoring service (if configured)
      if (process.env.MONITORING_WEBHOOK) {
        await this.sendWebhookAlert(alert);
      }

      // Store in database for audit trail
      await this.storeAlert(alert);

    } catch (error) {
      logError('Error sending alert:', error);
    }
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert) {
    try {
      const nodemailer = require('nodemailer');
      
      // Check if email is configured
      if (!process.env.ALERT_EMAIL) {
        logWarn('ALERT_EMAIL not configured, skipping email alert');
        return;
      }
      
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        logWarn('Gmail credentials not configured, skipping email alert');
        return;
      }
      
      // Create transporter
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      
      // Create email content
      const subject = `🚨 DATA PROTECTION ALERT: ${alert.type}`;
      const severity = alert.severity || 'medium';
      const severityEmoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
      
      const html = `
        <h2>${severityEmoji} Data Protection Alert</h2>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
        <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
        <p><strong>Environment:</strong> ${alert.environment}</p>
        <p><strong>Server:</strong> ${alert.server}</p>
        
        <h3>Details:</h3>
        <pre>${JSON.stringify(alert.details, null, 2)}</pre>
        
        <hr>
        <p><em>This alert was generated by the Jules Dating Data Protection Monitor.</em></p>
      `;
      
      // Send email
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ALERT_EMAIL,
        subject: subject,
        html: html
      });
      
      logInfo(`📧 Email alert sent to ${process.env.ALERT_EMAIL} for ${alert.type}`);
      
    } catch (error) {
      logError('Error sending email alert:', error);
    }
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert) {
    try {
      const fetch = require('node-fetch');
      await fetch(process.env.MONITORING_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
      logInfo(`🔗 Webhook alert sent for ${alert.type}`);
    } catch (error) {
      logError('Error sending webhook alert:', error);
    }
  }

  /**
   * Store alert in database
   */
  async storeAlert(alert) {
    try {
      // Create a simple alert collection
      const Alert = mongoose.model('Alert', new mongoose.Schema({
        type: String,
        timestamp: Date,
        severity: String,
        details: Object,
        environment: String,
        server: String
      }));

      await Alert.create(alert);
      logInfo(`💾 Alert stored in database: ${alert.type}`);
    } catch (error) {
      logError('Error storing alert:', error);
    }
  }

  /**
   * Check deletion patterns periodically
   */
  checkDeletionPatterns() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Clean up old deletion logs
    for (const [key, value] of this.deletionLog.entries()) {
      const [year, month, date, hour] = key.split('-');
      const logTime = new Date(year, month, date, hour);
      
      if (logTime < oneDayAgo) {
        this.deletionLog.delete(key);
      }
    }

    logInfo('🛡️ Data Protection Monitor: Deletion patterns checked');
  }

  /**
   * Get current deletion statistics
   */
  getDeletionStats() {
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    return {
      hourlyDeletions: this.deletionLog.get(hourKey) || 0,
      dailyDeletions: this.deletionLog.get(dayKey) || 0,
      totalTrackedDeletions: Array.from(this.deletionLog.values()).reduce((a, b) => a + b, 0),
      thresholds: this.alertThresholds
    };
  }
}

// Create singleton instance
DataProtectionMonitor.instance = new DataProtectionMonitor();

module.exports = DataProtectionMonitor;