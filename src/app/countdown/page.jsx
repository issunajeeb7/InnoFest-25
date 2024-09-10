"use client";

import React, { useState, useEffect } from "react";
import { WavyBackground } from "@/components/ui/wavy-background";

const CountdownTimer = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents = Object.keys(timeLeft).map((interval) => {
        if (!timeLeft[interval]) {
            return null;
        }

        return (
            <span
                className="text-2xl md:text-4xl font-bold mx-2"
                key={interval}
            >
                {timeLeft[interval]} {interval}{" "}
            </span>
        );
    });

    return (
        <div className="text-white text-center mt-8">
            {timerComponents.length ? (
                timerComponents
            ) : (
                <span className="text-4xl font-bold">Time&apos;s up!</span>
            )}
        </div>
    );
};

export default function WavyBackgroundDemo() {
    const hackathonEndDate = "2024-09-11T17:00:00";

    return (
        <WavyBackground
            colors={["#5AC08F", "#96CB67", "#0875A5", "#fffff", "#5C5C5C"]}
            className="max-w-4xl mx-auto pb-40"
        >
            <p className="text-4xl md:text-4xl lg:text-7xl text-white font-bold inter-var text-center">
                DUK InnoFest 2024
            </p>
            <p className="text-base md:text-lg mt-4 text-white font-normal inter-var text-center">
                Countdown to innovation
            </p>
            <CountdownTimer endDate={hackathonEndDate} />
        </WavyBackground>
    );
}
