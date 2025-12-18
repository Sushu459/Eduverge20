
import React from 'react'

interface CodeEditorProps {
  code: string
  setCode: (code: string) => void
  language: string
  setLanguage: (lang: string) => void
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  language,
  setLanguage,
}) => {
  const templates: Record<string, string> = {
    python: '# Write your Python code here\nprint("Hello, World!")\n',
    javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");\n',
    java: 'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Code Editor</h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={templates[language]}
        className="w-full h-64 p-3 border rounded font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
      />

      <button
        onClick={() => setCode(templates[language])}
        className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
      >
        📋 Insert Template
      </button>
    </div>
  )
}

export default CodeEditor