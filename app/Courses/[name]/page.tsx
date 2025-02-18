// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import toast, { Toaster } from "react-hot-toast";
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "rive-react";
import { Label } from "@/components/ui/label";
import Confetti from "react-canvas-confetti";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import styles from "@/styles/styles.module.css";
import "@/styles/LoginFormComponent.css";

export default function Page({ params }: { params: { name: string } }) {
  const name = params.name;

  const [score, setScore] = useState(0);
  const [count, setCount] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [content, setContent] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [progress, setProgress] = useState(10);
  const [response, setResponse] = useState("");
  const [output, setOutput] = useState("The response will appear here...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const markdown = await import(`@/data/${name}.d.ts`);
        setContent(markdown.data);
        setQuestion(markdown.data?.questions[0]);
      } catch (error) {
        toast.error("Error reading file");
      }
    };
    fetchData();
  }, [name]);

  const onSubmit = async () => {
    toast.success(
      `Based on the personality test, we are creating a response to diagnose ${name}`
    );

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: `hello I have obtained a score of ${30 - score}/30 in ${name} related issue. Based on my performance, I would like a cure for ${name}. The lesser the score, the better the precautions and cure the person should take.`,
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setResponse(data.text || "No response received, please try again.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!response) return;
    setOutput("");
    [...response].forEach((char, i) =>
      setTimeout(() => setOutput((prev) => prev + char), i * 10)
    );
  }, [response]);

  const STATE_MACHINE_NAME = "Login Machine";

  const { rive: riveInstance, RiveComponent } = useRive({
    src: "/bear.riv",
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
  });

  const trigSuccessInput = useStateMachineInput(
    riveInstance,
    STATE_MACHINE_NAME,
    "trigSuccess"
  );
  const trigFailInput = useStateMachineInput(
    riveInstance,
    STATE_MACHINE_NAME,
    "trigFail"
  );

  const onNext = () => {
    if (!chosen) {
      toast.error("Please select an option");
      return;
    }

    setProgress(progress + 10);
    setCount(count + 1);

    const currentScore = parseInt(chosen.split("+")[1]);
    setScore(score + currentScore);

    if (question?.correctOption === chosen.split("+")[0]) {
      trigSuccessInput?.fire();
    } else {
      trigFailInput?.fire();
    }

    if (count + 1 === content?.questions.length) {
      onSubmit();
    }

    setQuestion(content?.questions[count + 1]);
    setChosen(null);
  };

  return (
    <div className="around">
      <Toaster />
      {progress <= 100 ? (
        <>
          <RiveComponent className="rive-container" />
          <div className="flex flex-col mt-5 items-center h-screen gap-6">
            <Progress value={progress} className={cn("w-[60%]")} />
            <div className="w-[60%] flex justify-center">
              <h1 className="text-2xl font-bold">{question?.question}</h1>
            </div>
            <RadioGroup
              defaultValue="comfortable"
              onValueChange={(value) => setChosen(value)}
            >
              {question?.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`r${index}`} />
                  <Label htmlFor={`r${index}`}>{option.split("+")[0]}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button onClick={onNext}>Next</Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center h-screen gap-6">
          <h1 className="text-2xl mt-2 font-bold">You scored {score} out of 30</h1>
          <Button
            onClick={() => {
              setProgress(10);
              setScore(0);
              setCount(0);
              setQuestion(content?.questions[0]);
            }}
          >
            Restart
          </Button>
          <Confetti />
          {score > 20 && (
            <div className="flex items-center flex-col gap-5">
              <h1 className="text-2xl font-bold">
                Congratulations! You have obtained a <span className="font-black text-red-500">Gold Medal</span>
              </h1>
              <Image src="/icons/goldmedal.svg" width={100} height={100} />
            </div>
          )}
          {score > 10 && score <= 20 && (
            <div className="flex items-center flex-col gap-5">
              <h1 className="text-2xl font-bold">
                Congratulations! You have obtained a <span className="font-black text-red-500">Silver Medal</span>
              </h1>
              <Image src="/icons/silvermedal.svg" width={100} height={100} />
            </div>
          )}
          {score <= 10 && (
            <div className="flex items-center flex-col gap-5">
              <h1 className="text-2xl font-bold">
                Congratulations! You have obtained a <span className="font-black text-red-500">Bronze Medal</span>
              </h1>
              <Image src="/icons/bronzemedal.svg" width={100} height={100} />
            </div>
          )}
          <Card className={cn("p-5 whitespace-normal w-full md:w-[600px]")}>
            <Markdown>{output}</Markdown>
          </Card>
        </div>
      )}
    </div>
  );
}





