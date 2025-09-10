const Category = require("../models/Category");

// Helper
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const categoryDetails = await Category.create({
      name,
      description,
    });

    console.log("Category Created:", categoryDetails);

    return res.status(200).json({
      success: true,
      message: "Category created successfully",
      data: categoryDetails,
    });
  } catch (error) {
    console.error("Error in createCategory:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Categories
exports.showAllCategories = async (req, res) => {
  try {
    console.log("Fetching all categories...");
    const categories = await Category.find({});
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error in showAllCategories:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Category Page Details
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;
    console.log("Category ID:", categoryId);

    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: "ratingAndReviews",
      })
      .exec();

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No courses found in this category",
      });
    }

    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    });

    const randomCategory =
      categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)];

    const differentCategory = await Category.findById(randomCategory?._id)
      .populate({
        path: "courses",
        match: { status: "Published" },
      })
      .exec();

    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: {
          path: "instructor",
        },
      })
      .exec();

    const allCourses = allCategories.flatMap((category) => category.courses);
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    });
  } catch (error) {
    console.error("Error in categoryPageDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
