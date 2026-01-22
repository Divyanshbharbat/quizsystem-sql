import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiCheck, FiX } from "react-icons/fi";

const UploadQuestions = () => {
  const navigate = useNavigate();
  const facultyDetails = JSON.parse(localStorage.getItem("facultyDetails"));
  const fileInputRef = useRef();

  const [csvFile, setCsvFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

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

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!facultyDetails) {
      navigate("/");
    }
  }, [navigate]);

  // ==================== CSV HANDLING ====================
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("❌ Please select a CSV file");
      return;
    }

    setCsvFile(file);
    setFileName(file.name);

    // Preview CSV data
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const rows = csv.split("\n").slice(0, 6); // First 5 rows + header
        setPreviewData(rows);
        setShowPreview(true);
      } catch (err) {
        toast.error("❌ Error reading CSV file");
      }
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error("❌ Please select a CSV file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setUploadProgress(30);
        
        const res = await axios.post(
          `${import.meta.env.VITE_APP}/api/quizzes/create`,
          { csvData: e.target.result },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        setUploadProgress(90);

        if (res.data.success) {
          toast.success("✅ Questions uploaded successfully!");
          setCsvFile(null);
          setFileName("");
          setShowPreview(false);
          setPreviewData([]);
          setUploadProgress(100);

          setTimeout(() => {
            setUploading(false);
            setUploadProgress(0);
            fileInputRef.current?.click?.();
          }, 1000);
        }
      } catch (err) {
        console.error(err);
        toast.error(
          `❌ Upload failed: ${err.response?.data?.message || "Please check your CSV format"}`
        );
        setUploading(false);
        setUploadProgress(0);
      }
    };

    reader.readAsText(csvFile);
  };

  // ==================== IMAGE QUESTION HANDLING ====================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("❌ Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageQuestion({ ...imageQuestion, image: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleImageQuestionChange = (field, value) => {
    setImageQuestion({ ...imageQuestion, [field]: value });
  };

  const handleUploadImageQuestion = async () => {
    if (
      !imageQuestion.category ||
      !imageQuestion.subcategory ||
      !imageQuestion.image ||
      !imageQuestion.optionA ||
      !imageQuestion.optionB ||
      !imageQuestion.optionC ||
      !imageQuestion.optionD
    ) {
      toast.error("❌ Please fill all required fields");
      return;
    }

    setUploadingImage(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP}/api/quizzes/image-question`,
        imageQuestion
      );

      if (res.data.success) {
        toast.success("✅ Image question uploaded successfully!");
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
      }
    } catch (err) {
      console.error(err);
      toast.error(`❌ Error uploading image question`);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="faculty" facultyDetails={facultyDetails} />
      <Toaster />

      <div className="flex flex-col flex-1">
        <Navbar
          userName={facultyDetails?.name || "Upload Questions"}
          onProfileClick={() => navigate(-1)}
        />

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800">Upload Questions</h2>
            <p className="text-gray-600 mb-4 text-sm">Add questions to your quiz database</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* CSV UPLOAD SECTION */}
              <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FiUpload size={22} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">CSV Bulk Upload</h3>
                </div>

                <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center mb-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer"
                  >
                    <div className="text-3xl mb-1">📁</div>
                    <p className="text-gray-700 font-semibold text-sm mb-0.5">Click to select CSV file</p>
                    <p className="text-xs text-gray-600">CSV with headers (category, subcategory...)</p>
                    {fileName && (
                      <p className="mt-1 text-blue-600 font-medium text-sm">
                        ✓ {fileName}
                      </p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {showPreview && previewData.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Preview (First 5 rows):</p>
                    <div className="text-xs text-gray-600 space-y-0.5 max-h-24 overflow-y-auto">
                      {previewData.map((row, idx) => (
                        <div key={idx} className="font-mono text-gray-700 truncate">
                          {row}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCsvUpload}
                  disabled={!csvFile || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm mb-2"
                >
                  {uploading ? "Uploading..." : "Upload CSV"}
                </button>

                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded text-xs text-gray-700">
                  <p className="font-semibold mb-1">CSV Format:</p>
                  <code className="text-xs truncate block">category,subcategory,option_a,option_b,option_c,option_d,correct_option,description</code>
                </div>
              </div>

              {/* IMAGE QUESTION UPLOAD SECTION */}
              <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FiUpload size={22} className="text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">Image Question</h3>
                </div>

                <div className="space-y-3">
                  {/* Category & Subcategory */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Category *
                      </label>
                      <input
                        type="text"
                        value={imageQuestion.category}
                        onChange={(e) =>
                          handleImageQuestionChange("category", e.target.value)
                        }
                        placeholder="e.g., Science"
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Subcategory *
                      </label>
                      <input
                        type="text"
                        value={imageQuestion.subcategory}
                        onChange={(e) =>
                          handleImageQuestionChange("subcategory", e.target.value)
                        }
                        placeholder="e.g., Biology"
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Upload Image *
                    </label>
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-3 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="imageInput"
                      />
                      <label htmlFor="imageInput" className="cursor-pointer">
                        {imageQuestion.image ? (
                          <div>
                            <img
                              src={imageQuestion.image}
                              alt="Preview"
                              className="h-20 w-20 mx-auto mb-1 rounded"
                            />
                            <p className="text-xs text-green-600 font-semibold">✓ Image selected</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xl mb-0.5">🖼️</p>
                            <p className="text-gray-700 font-semibold text-sm">Click to select image</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={imageQuestion.description}
                      onChange={(e) =>
                        handleImageQuestionChange("description", e.target.value)
                      }
                      placeholder="Question description..."
                      rows="2"
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((option) => (
                      <div key={option}>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Option {option} *
                        </label>
                        <input
                          type="text"
                          value={imageQuestion[`option${option}`]}
                          onChange={(e) =>
                            handleImageQuestionChange(`option${option}`, e.target.value)
                          }
                          placeholder={`Option ${option}`}
                          className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Option */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Correct Option *
                    </label>
                    <select
                      value={imageQuestion.correctOption}
                      onChange={(e) =>
                        handleImageQuestionChange("correctOption", e.target.value)
                      }
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>

                  <button
                    onClick={handleUploadImageQuestion}
                    disabled={uploadingImage}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {uploadingImage ? "Uploading..." : (
                      <>
                        <FiCheck size={18} /> Upload Image Question
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* INFO BOX */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-base font-bold text-gray-800 mb-2">Upload Tips</h4>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex gap-1">
                  <span>✓</span>
                  <span>CSV files should have headers in the first row</span>
                </li>
                <li className="flex gap-1">
                  <span>✓</span>
                  <span>Image questions must have at least 4 options</span>
                </li>
                <li className="flex gap-1">
                  <span>✓</span>
                  <span>Supported image formats: JPG, PNG, GIF, WebP</span>
                </li>
                <li className="flex gap-1">
                  <span>✓</span>
                  <span>All fields marked with * are required</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UploadQuestions;
