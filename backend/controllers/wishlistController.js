const WishListItem = require('../models/WishListItem');

// Get all wishlist items for a user
exports.getWishlistItems = async (req, res) => {
  try {
    const items = await WishListItem.find({ 
      userId: req.user.id,
      status: { $ne: 'removed' }
    }).sort({ createdAt: -1 });
    
    res.json({ items });
  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist items' });
  }
};

// Add item to wishlist
exports.addWishlistItem = async (req, res) => {
  try {
    console.log('DEBUG: Wishlist add request received');
    console.log('DEBUG: User ID:', req.user?.id);
    console.log('DEBUG: Request body:', req.body);
    
    const { title, link, image, price, description, brand, source = 'chat', notes } = req.body;
    
    if (!title || !link || !image) {
      console.log('DEBUG: Missing required fields - title:', !!title, 'link:', !!link, 'image:', !!image);
      return res.status(400).json({ error: 'Title, link, and image are required' });
    }
    
    // Check if item already exists in user's wishlist
    const existingItem = await WishListItem.findOne({
      userId: req.user.id,
      link: link,
      status: { $ne: 'removed' }
    });
    
    if (existingItem) {
      console.log('DEBUG: Item already exists in wishlist');
      return res.status(409).json({ 
        error: 'Item already exists in your wishlist',
        message: 'Item already added to wishlist'
      });
    }
    
    const wishlistItem = new WishListItem({
      userId: req.user.id,
      title,
      link,
      image,
      price,
      description,
      brand,
      source,
      notes
    });
    
    await wishlistItem.save();
    res.status(201).json({ item: wishlistItem });
  } catch (error) {
    console.error('Error adding wishlist item:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
};

// Update wishlist item
exports.updateWishlistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const item = await WishListItem.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { status, notes },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    
    res.json({ item });
  } catch (error) {
    console.error('Error updating wishlist item:', error);
    res.status(500).json({ error: 'Failed to update wishlist item' });
  }
};

// Move item from wishlist to closet
exports.moveToCloset = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, brand: itemBrand } = req.body;
    
    // Get the wishlist item
    const wishlistItem = await WishListItem.findOne({
      _id: id,
      userId: req.user.id
    });
    
    if (!wishlistItem) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    
    // Create closet item data
    const closetItemData = {
      name: name || wishlistItem.title,
      type: type || 'outfit',
      brand: itemBrand || wishlistItem.brand,
      imageUrl: wishlistItem.image,
      tags: []
    };
    
    // Add tags based on available information
    if (wishlistItem.brand) {
      closetItemData.tags.push({ brand: wishlistItem.brand });
    }
    
    // Update wishlist item status to purchased
    wishlistItem.status = 'purchased';
    await wishlistItem.save();
    
    // Return the closet item data for the frontend to handle
    res.json({ 
      success: true,
      closetItemData,
      message: 'Item moved to closet successfully'
    });
  } catch (error) {
    console.error('Error moving item to closet:', error);
    res.status(500).json({ error: 'Failed to move item to closet' });
  }
};

// Remove item from wishlist
exports.removeWishlistItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await WishListItem.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { status: 'removed' },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    
    res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
};

// Get wishlist statistics
exports.getWishlistStats = async (req, res) => {
  try {
    const stats = await WishListItem.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statsObj = {
      wishlist: 0,
      purchased: 0,
      removed: 0
    };
    
    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
    });
    
    res.json({ stats: statsObj });
  } catch (error) {
    console.error('Error fetching wishlist stats:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist statistics' });
  }
}; 