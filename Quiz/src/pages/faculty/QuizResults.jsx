import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

const QuizResults = () => {
  const { quizId } = useParams();
  console.log(quizId);
  const location = useLocation();
  const [quizTitle, setQuizTitle] = useState(location.state?.quizTitle || "");
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizTitle = async () => {
      if (!quizTitle) {
        try {
      const res = await axios.get(
  `${import.meta.env.VITE_APP}/api/quizzes/title/${quizId}`,
  {
    withCredentials: true,
  }
);


          console.log("titleee", res.data);
          setQuizTitle(res.data.data.quiz.title || "Untitled Quiz");
        } catch (err) {
          console.error("Failed to fetch quiz title:", err);
          setQuizTitle("Untitled Quiz");
        }
      }
    };

    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
     const res = await axios.get(
  `${import.meta.env.VITE_APP}/api/quizzes/${quizId}/submissions`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);



        if (res.data.success) {
          let subs = res.data.data;
          console.log(subs);
          subs = await Promise.all(
            subs.map(async (sub) => {
              if (!sub.studentId?.name) return sub;
              try {
             const studentRes = await axios.get(
  `${import.meta.env.VITE_APP}/api/student/info?name=${encodeURIComponent(
    sub.studentId.name
  )}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


                const studentData = studentRes.data.data;
                return {
                  ...sub,
                  studentId: {
                    ...sub.studentId,
                    department: studentData?.department || "-",
                    year: studentData?.year || "-",
                  },
                };
              } catch (err) {
                console.error("Failed to fetch student info", err);
                return sub;
              }
            })
          );

          setSubmissions(subs);

          if (subs.length > 0) {
            const uniqueQs = subs[0].answers.map((ans) => ({ _id: ans.questionId }));
            setQuestions(uniqueQs);
          }
        }
      } catch (err) {
        console.error("Failed to fetch submissions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizTitle();
    fetchSubmissions();
  }, [quizId, quizTitle]);

  const handleDownloadExcel = () => {
    if (!submissions.length) return;

    const data = submissions.map((sub) => {
      const row = {
        "Quiz Title": quizTitle,
        "Student Name": sub.studentId?.name || "-",
        "Student ID": sub.studentId?.studentId || "-",
        Department: sub.studentId?.department || "-",
        Year: sub.studentId?.year || "-",
        "Submitted At": new Date(sub.submittedAt).toLocaleString(),
      };

      questions.forEach((q, idx) => {
        const answer = sub.answers.find((a) => a.questionId === q._id);
        row[`Q.${idx + 1}`] = answer ? answer.score || 0 : 0;
      });

      row["Total Score"] = questions.reduce((sum, q) => {
        const answer = sub.answers.find((a) => a.questionId === q._id);
        return sum + (answer?.score || 0);
      }, 0);

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QuizResults");
    XLSX.writeFile(workbook, `${quizTitle.replace(/\s/g, "_")}_Results.xlsx`);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">📊 {quizTitle} - Results</h2>
        <button
          onClick={handleDownloadExcel}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition font-semibold"
        >
          Download Excel
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
        <table className="min-w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-2 border border-gray-300">Student Name</th>
              <th className="px-4 py-2 border border-gray-300">Student ID</th>
              <th className="px-4 py-2 border border-gray-300">Department</th>
              <th className="px-4 py-2 border border-gray-300">Year</th>
              <th className="px-4 py-2 border border-gray-300">Submitted At</th>
              {questions.map((_, idx) => (
                <th key={idx} className="px-3 py-2 border border-gray-300 text-center">
                  Q.{idx + 1}
                </th>
              ))}
              <th className="px-4 py-2 border border-gray-300">Total Score</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, sIdx) => {
              const totalScore = questions.reduce((sum, q) => {
                const answer = sub.answers.find((a) => a.questionId === q._id);
                return sum + (answer?.score || 0);
              }, 0);

              return (
                <tr
                  key={sub._id}
                  className={`${sIdx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}
                >
                  <td className="px-4 py-2 border border-gray-300">{sub.studentId?.name || "-"}</td>
                  <td className="px-4 py-2 border border-gray-300">{sub.studentId?.studentId || "-"}</td>
                  <td className="px-4 py-2 border border-gray-300">{sub.studentId?.department || "-"}</td>
                  <td className="px-4 py-2 border border-gray-300">{sub.studentId?.year || "-"}</td>
                  <td className="px-4 py-2 border border-gray-300">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  {questions.map((q) => {
                    const answer = sub.answers.find((a) => a.questionId === q._id);
                    return (
                      <td key={q._id} className="px-3 py-2 border border-gray-300 text-center font-medium">
                        {answer?.score ?? 0}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 border border-gray-300 text-center font-bold text-blue-600">
                    {totalScore}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuizResults;
