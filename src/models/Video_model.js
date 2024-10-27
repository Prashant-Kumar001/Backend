import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const { Schema } = mongoose;

// Create Video Schema
const videoSchema = new Schema({
  videoFile: {
    type: String, // URL of the video file
    required: true
  },
  thumbnail: {
    type: String, // URL of the thumbnail image
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the 'User' model
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 150 // Limiting title length for better UX
  },
  description: {
    type: String,
    maxlength: 5000, // Limiting description length for performance
  },
  duration: {
    type: Number, // Video duration in seconds
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false // Default to unpublished until approved
  },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Add pagination plugin

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model('Video', videoSchema);

export default Video;
