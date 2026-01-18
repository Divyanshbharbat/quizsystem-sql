import mongoose from "mongoose";
const { Schema, model } = mongoose;

const QuizSubmissionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  answers: [
    {
      questionId: {
        type: Schema.Types.ObjectId, // Matches Quiz model's question _id
        required: true
      },
      selectedOption: {
       type: String, // make it optional
      required: false, // <-- change from true to false
      default: null
      }
    }
  ],
  totalMarks: {
    type: Number,
    default: 0 // will be set when quiz is submitted
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    default: false // false until user submits
  }
});

const QuizSubmission = model("QuizSubmission", QuizSubmissionSchema);

export default QuizSubmission;
