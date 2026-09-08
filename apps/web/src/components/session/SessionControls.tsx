interface ControlsProps {
    isRecording: boolean;
    error?: string | null;
    disabled?: boolean;
    onStart: () => void;
    onStop: () => void;
}

export default function SessionControls({ isRecording, error, disabled = false, onStart, onStop }: ControlsProps) {
    return (
        <div className="mt-auto pt-4 space-y-3">
            {error ? (
                <p className="text-sm leading-5 text-red-300">{error}</p>
            ) : null}
            {isRecording ? (
                <button
                    type="button"
                    onClick={onStop}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                >
                    Stop Session
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onStart}
                    disabled={disabled}
                    className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                    Start Session
                </button>
            )}
        </div>
    );
}
