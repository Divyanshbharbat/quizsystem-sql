import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
const CreateQuiz = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [quizzes, setQuizzes] = useState([]); // ✅ always array
  const [uploadingImage, setUploadingImage] = useState(false); // ✅ Loader state

  const [isNewQuiz, setIsNewQuiz] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState(null);

  const [imageQuestion, setImageQuestion] = useState({
    category: "",
    subcategory: "",
    image: null,
    description: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
  });
  let navigate = useNavigate()
  useEffect(() => {
    const faculty = localStorage.getItem("facultyDetails");
  
    if (!faculty) {
      navigate("/");
    }
  }, [navigate]);
  

  /* =========================
     FETCH QUIZZES (SAFE)
  ========================== */
  const fetchQuizzes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/quizzes");

      // ✅ FIX: always extract array
      const quizList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      setQuizzes(quizList);
    } catch (err) {
     
      setQuizzes([]);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  /* =========================
     CSV UPLOAD
  ========================== */
  const handleCsvUpload = async () => {
    if (!csvFile) return toast.error("Please select CSV file");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await axios.post("http://localhost:5000/api/quizzes/create", {
          csvData: e.target.result,
        });
        toast.success("Quiz uploaded successfully");
        fetchQuizzes();
      } catch (err) {
        toast.error("CSV upload failed");
      }
    };
    reader.readAsText(csvFile);
  };

  /* =========================
     CREATE IMAGE QUIZ
  ========================== */
  const handleCreateImageQuiz = async () => {
    const {
      category,
      subcategory,
      image,
      description,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
    } = imageQuestion;

    if (!category || !subcategory)
      return toast.error("Category & Subcategory required");

    const options = [optionA, optionB, optionC, optionD];

    const formData = new FormData();
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("image", image);
    formData.append("description", description);
    formData.append("options", JSON.stringify(options));
    formData.append(
      "answer",
      options["ABCD".indexOf(correctOption)]
    );

    try {
      setUploadingImage(true); // ✅ Show loader
      toast.loading("Uploading image-based question...", { id: "img-upload" });
      console.log("[IMAGE_UPLOAD] Sending request to /api/quizzes/imagebaseqs");
      console.log("[IMAGE_UPLOAD] FormData:", {
        category: category,
        subcategory: subcategory,
        description: description,
        options: options,
        answer: options["ABCD".indexOf(correctOption)]
      });
      
      const res = await axios.post("http://localhost:5000/api/quizzes/imagebaseqs", formData);
      console.log("[IMAGE_UPLOAD] ✅ Response received:", res.data);
      
      setUploadingImage(false); // ✅ Hide loader
      toast.success("✅ Image question uploaded! Refreshing categories...", { id: "img-upload", duration: 3000 });
      setCurrentQuizId(res.data.quizId);
      setIsNewQuiz(true);
      resetImageForm(false);
      fetchQuizzes();
    } catch (err) {
      setUploadingImage(false); // ✅ Hide loader on error
      console.error("[IMAGE_UPLOAD] ❌ Upload failed:", err);
      console.error("[IMAGE_UPLOAD] Error response:", err.response?.data);
      toast.error("❌ Image upload failed: " + (err.response?.data?.message || err.message), { id: "img-upload", duration: 4000 });
    }
  };

  /* =========================
     ADD IMAGE QUESTION
  ========================== */
  const handleAddImageQuestion = async () => {
    if (!currentQuizId) return toast.error("No quiz selected");

    const {
      category,
      subcategory,
      image,
      description,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
    } = imageQuestion;

    if (!category || !subcategory)
      return toast.error("Category & Subcategory required");

    const options = [optionA, optionB, optionC, optionD];

    const formData = new FormData();
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("image", image);
    formData.append("description", description);
    formData.append("options", JSON.stringify(options));
    formData.append(
      "answer",
      options["ABCD".indexOf(correctOption)]
    );

    try {
      setUploadingImage(true); // ✅ Show loader
      toast.loading("Adding image question...", { id: "img-add" });
      
      await axios.post(
        `/api/quizzes/${currentQuizId}/addqs`,
        formData
      );
      
      setUploadingImage(false); // ✅ Hide loader
      toast.success("✅ Question added successfully!", { id: "img-add" });
      resetImageForm(false);
    } catch (err) {
      setUploadingImage(false); // ✅ Hide loader on error
      toast.error("❌ Failed to add question", { id: "img-add" });
    }
  };

  /* =========================
     RESET FORM
  ========================== */
  const resetImageForm = (closeForm = true) => {
    setImageQuestion({
      category: "",
      subcategory: "",
      image: null,
      description: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
    });

    if (closeForm) setShowImageForm(false);
  };

  /* =========================
     UI
  ========================== */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <Navbar />
        <Toaster />

        <div className="max-w-6xl mx-auto mt-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Create Quiz</h1>
            <p className="text-gray-600">Add new questions to your quiz repository</p>
          </div>

          {/* CSV Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-blue-600">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Upload CSV Quiz</h2>
            </div>
            <p className="text-gray-600 mb-4">Import multiple questions from a CSV file</p>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
              />
              <button
                onClick={handleCsvUpload}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Upload
              </button>
            </div>
          </div>

          {/* Image Quiz Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-600">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Create Image-Based Quiz</h2>
            </div>
            <p className="text-gray-600 mb-6">Add a new image question with multiple choice options</p>

            <div className="space-y-6">
              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <input
                    placeholder="Enter category (e.g., Biology, History)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition"
                    value={imageQuestion.category}
                    onChange={(e) =>
                      setImageQuestion({ ...imageQuestion, category: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory *</label>
                  <input
                    placeholder="Enter subcategory (e.g., Plant Biology)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition"
                    value={imageQuestion.subcategory}
                    onChange={(e) =>
                      setImageQuestion({
                        ...imageQuestion,
                        subcategory: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full"
                    onChange={(e) =>
                      setImageQuestion({
                        ...imageQuestion,
                        image: e.target.files[0],
                      })
                    }
                  />
                  <p className="text-gray-500 mt-2">
                    {imageQuestion.image ? imageQuestion.image.name : "Click to upload or drag and drop"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question Description *</label>
                <textarea
                  placeholder="Describe what students should do with this image (e.g., Identify the structure in the image)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition resize-none"
                  rows="3"
                  value={imageQuestion.description}
                  onChange={(e) =>
                    setImageQuestion({
                      ...imageQuestion,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Answer Options *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Option {opt}</label>
                      <input
                        placeholder={`Enter option ${opt}`}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition"
                        value={imageQuestion[`option${opt}`]}
                        onChange={(e) =>
                          setImageQuestion({
                            ...imageQuestion,
                            [`option${opt}`]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mark Correct Answer *</label>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <select
                    className="w-full px-4 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-600 transition bg-white"
                    value={imageQuestion.correctOption}
                    onChange={(e) =>
                      setImageQuestion({
                        ...imageQuestion,
                        correctOption: e.target.value,
                      })
                    }
                  >
                    <option value="A">✓ Option A is correct</option>
                    <option value="B">✓ Option B is correct</option>
                    <option value="C">✓ Option C is correct</option>
                    <option value="D">✓ Option D is correct</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateImageQuiz}
                disabled={uploadingImage} // ✅ Disable during upload
                className={`w-full mt-6 px-6 py-3 text-white font-bold rounded-lg transition duration-200 transform flex items-center justify-center gap-2 ${
                  uploadingImage
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:scale-105"
                }`}
              >
                {uploadingImage ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Quiz Question
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateQuiz;
