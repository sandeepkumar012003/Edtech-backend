const RatingAndReview = require("../models/RatingAndRaview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

exports.createRating = async (req, res) => {
  try {
    //get user id
    const userId = req.user.id;
    console.log("iddd",userId);

    //fetch the data
    const { rating, review, courseId } = req.body;

    
    

    //check if user enrolled or not
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });
    console.log(courseDetails);
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "student is not enrooled in the course plese enroll in course",
      });
    }
    console.log(rating, review, courseId + "nikesh2");
    //check before user review or not // one time review is allowed
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });
    console.log(userId, courseId + "nikesh3");
    console.log(alreadyReviewed);


    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message:
          "user already reviewed cannot reviewed again for the same course",
      });
    }
    console.log(rating, review, courseId + "nikesh4");

    //create rating and review
    const ratingReview = await RatingAndReview.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });
    console.log(rating, review, courseId);

    // update the course with rating and review
    const updatedCouseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $push: { ratingAndReviews: ratingReview._id },
      },
      {
        new: true,
      },
    );
    console.log(updatedCouseDetails);

    //return response
    return res.status(200).json({
      success: true,
      message: "rating and review created successfully",
      ratingReview,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "unable to create rating and review",
    });
  }
};
// getavg rating handler

exports.getAverageRating = async (req, res) => {
  try {
    // get course id
    const courseId = req.body.courseId;
    // calculate avg rating
    const result = await RatingAndReview.aggregate([
      {
        // searching the coorse with particular id in rating and review section
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        // grouping  all the ratings with that paritcular id
        $group: {
          _id: null,
          // calculating the avg rating of grouped rating
          averageRating: { $avg: "$rating" },
        },
      },
    ]);
    // returning the rating

    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }
    // if no rating exist
    return res.status(200).json({
      success: true,
      message: "average rating is 0 till now ",
      averageRating: 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "unable to find avg rating",
    });
  }
};

//handler function to getall rating

exports.getAllRating = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        select: "firsName lastName email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();

    return res.status(200).json({
      success: true,
      message: "all reviews fetched successfully",
      data: allReviews,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "unable to find out all rating or get all rating",
    });
  }
};
