import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fluent AI - Home",
};

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-4xl font-bold text-black dark:text-white">
            Welcome to <span className="text-blue-500">FluentAI</span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Get started by going to <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">/session</code>
          </p>
        </div>
      </main>
    </div>
  );
}
