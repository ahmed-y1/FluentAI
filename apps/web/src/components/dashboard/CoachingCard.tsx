export default function CoachingCard({ feedback, score }: { feedback: string | null; score: number }) {
    if (!feedback) return null;

    const html = feedback
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .split("\n")
        .map(line =>
            line.match(/^[•\-\*] /) ? `<li>${line.slice(2)}</li>` :
                line.match(/^\d+\./) ? `<p class="font-medium text-teal-300 mt-3">${line}</p>` :
                    line ? `<p>${line}</p>` : ""
        )
        .join("");

    return (
        <div className="bg-gray-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">AI Coaching Feedback</h2>
                <span className="text-2xl font-semibold text-teal-400">{Math.round(score)}/100</span>
            </div>
            <div
                className="text-gray-300 text-sm leading-relaxed [&_strong]:text-white [&_li]:ml-4 [&_li]:list-disc [&_li]:mb-1 space-y-2"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}