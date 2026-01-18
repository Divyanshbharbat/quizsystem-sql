import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const Template = () => {
  const [copied, setCopied] = useState(false);

  const prompt = `
You are an AI assistant.

TASK:
I will upload a question paper (image, PDF, or text) OR I may ask you to GENERATE RAW DATA.
Your job is to extract or generate ALL multiple-choice questions and return them in a SINGLE CSV FILE.

IMPORTANT:
If I say **"give raw data"**, you MUST generate questions yourself and return the CSV.

CSV FORMAT (STRICT — DO NOT CHANGE):
The CSV must contain EXACTLY these columns in this order:

Category,Subcategory,Question,Options,Answer

DEFINITIONS:
• Category → Subject name (DBMS, OS, CN, DSA, Physics, Math, Aptitude, etc.)
• Subcategory → Topic inside category (Transactions, Normalization, Scheduling, Arrays, etc.)
• Question → Full question text (plain text, no numbering)
• Options → ALL options in ONE cell, separated by comma
• Answer → EXACT option text (must match one option exactly)

RULES (VERY IMPORTANT):
1. Output ONLY RAW CSV (no markdown, no explanation, no headings)
2. ALL data must be in ONE SINGLE CSV
3. One question per row
4. Options must be comma-separated
5. Answer MUST exist inside Options
6. Remove question numbers, bullets, or extra symbols
7. Infer Category/Subcategory if unclear
8. Ignore non-MCQ questions
9. Ensure CSV is directly downloadable and upload-ready

WHEN I ASK FOR RAW DATA:
• Generate multiple categories
• Each category must have 3–5 subcategories
• Each subcategory must contain EXACTLY 10 questions
• Return the FINAL OUTPUT as ONE CSV ONLY

EXAMPLE OUTPUT:

Category,Subcategory,Question,Options,Answer
DBMS,Transactions,What is the primary purpose of a transaction?,"Ensure data integrity,Increase speed,Reduce storage,Improve UI",Ensure data integrity
DBMS,Transactions,Which property ensures all steps of a transaction complete?,"Atomicity,Consistency,Isolation,Durability",Atomicity
DBMS,Transactions,What does ACID stand for?,"Atomicity, Consistency, Isolation, Durability, Access, Control, Integrity, Durability",Atomicity, Consistency, Isolation, Durability
DBMS,Transactions,What isolation level prevents dirty reads?,"Read Uncommitted,Read Committed,Repeatable Read,Serializable",Read Committed


Now wait for my input or uploaded question paper.
Give me the output ONLY in CSV format.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 5000);
  };

  return (
    <div className="flex min-h-screen ">
      <Sidebar />
        
      <div className="flex-1">
        <div className="p-3 ">
            <Navbar userName="Template Prompt Generator" />
        </div>
        <div className="flex-1 p-4 lg:p-4 flex justify-center items-start">
          <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl p-4 lg:p-8">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4">
              📄 Universal Quiz CSV Prompt
            </h1>

            <p className="text-gray-600 text-base mb-6">
              Generates a <b>single downloadable CSV</b> for quiz upload.
              Works for uploaded papers or RAW data generation.
            </p>

            <button
              onClick={handleCopy}
              className={`w-60 mb-3 py-2 rounded-xl font-semibold text-lg text-white transition-all duration-300 
                ${copied ? "bg-green-500 hover:bg-green-600" : "bg-gradient-to-r from-green-300 to-teal-700 hover:scale-105"}`}
            >
              {copied ? " Prompt Copied!" : " Copy Prompt"}
            </button>

            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-sm lg:text-base leading-7 overflow-y-auto max-h-96">
              {prompt}
            </pre>

           
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template;
