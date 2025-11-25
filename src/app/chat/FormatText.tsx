// components/AssistantMessage.tsx
import React from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  text: string;
}

const FormatText: React.FC<Props> = ({ text }) => {
  return (
    <div className="format-text">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
};

export default FormatText;