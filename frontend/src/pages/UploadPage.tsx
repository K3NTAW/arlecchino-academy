import { FormEvent, useState } from "react";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { generateLesson, uploadPdf } from "../lib/api";
import { ArlecchinoLoader } from "../components/ArlecchinoLoader";
import { useAppStore } from "../store/appStore";

type UploadPhase = "idle" | "uploading" | "generating" | "done" | "error";

export function UploadPage() {
  const token = useAppStore((state) => state.token);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setGenerating = useAppStore((state) => state.setGenerating);
  const isGenerating = useAppStore((state) => state.isGenerating);
  const upsertLesson = useAppStore((state) => state.upsertLesson);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !file) {
      return;
    }
    setError(null);
    try {
      setPhase("uploading");
      const extracted = await uploadPdf(token, file);
      setPhase("generating");
      setGenerating(true);
      const generated = await generateLesson({
        token,
        extractedText: extracted.text,
        language,
        title: title.trim() || undefined
      });
      setPhase("done");
      upsertLesson({
        id: generated.lessonId,
        title: title.trim() || "Generated Tome",
        language,
        createdAt: new Date().toISOString(),
        challengeCount: 0
      });
      navigate(`/lesson/${generated.lessonId}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload/generate.");
      setPhase("error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.section
      className="upload-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isGenerating ? <ArlecchinoLoader message="The Director is reviewing your materials..." /> : null}
      <button className="back-link" type="button" onClick={() => navigate("/dashboard")}>
        <ArrowLeft size={15} />
        Back
      </button>
      <header>
        <h1>Submit a New Tome</h1>
        <p>Upload your lecture PDF. The Director will study it and prepare your challenges.</p>
      </header>

      <form className="upload-form" onSubmit={onSubmit}>
        <label htmlFor="lesson-title">Tome title (optional)</label>
        <input
          id="lesson-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Mission: Polymorphism"
        />

        <label htmlFor="pdf-file">PDF Upload</label>
        <label className={`drop-zone ${file ? "selected" : ""}`} htmlFor="pdf-file">
          <BookOpenText size={24} />
          <span>Drop your tome here, or click to summon it</span>
          <small>PDF only · max 20MB</small>
          {file ? (
            <strong>
              {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </strong>
          ) : null}
        </label>
        <input
          id="pdf-file"
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            if (next && (next.type !== "application/pdf" || next.size > 20 * 1024 * 1024)) {
              setError("Only PDF files up to 20MB are allowed.");
              setFile(null);
              return;
            }
            setError(null);
            setFile(next);
          }}
        />

        <div className="lang-switch-group">
          <span>Lesson language</span>
          <div>
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={language === "sr" ? "active" : ""}
              onClick={() => setLanguage("sr")}
            >
              SR
            </button>
          </div>
        </div>

        {error ? <p className="inline-error">{error}</p> : null}
        <button className="generate-btn" disabled={!file || phase === "uploading" || phase === "generating"}>
          {phase === "uploading" ? "Summoning tome..." : phase === "generating" ? "Analyzing..." : "Begin Analysis"}
        </button>
      </form>
    </motion.section>
  );
}
