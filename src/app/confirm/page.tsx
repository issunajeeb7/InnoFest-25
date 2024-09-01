"use client";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, redirect } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Link from "next/link";

const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY as string
);

const themes = [
    "Agriculture, FoodTech & Rural Development",
    "Blockchain & Cybersecurity",
    "Clean & Green Technology",
    "Fitness & Sports",
    "Heritage & Culture",
    "MedTech / BioTech / HealthTech",
    "Miscellaneous",
    "Renewable / Sustainable Energy",
    "Robotics and Drones",
    "Smart Automation",
    "Smart Vehicles",
    "Travel & Tourism",
    "Transportation & Logistics",
    "Disaster Management",
    "Smart Education",
    "Toys & Games",
    "Space Technology",
    "Smart Resource Conservation",
];

export default function ConfirmationForm() {
    const [formData, setFormData] = useState({
        teamName: "",
        theme: "",
        problemStatementNumber: "",
        problemStatementTitle: "",
        vegetarianCount: 0,
        resources: "",
        dayScholarCount: 0,
        groupPhoto: null as File | null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState(null);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
            } else {
                setIsLoading(false);
                setUser(session.user);

                const { data, error } = await supabase
                    .from("allowed_users")
                    .select("name")
                    .eq("email", session.user.email);

                if (error) {
                    console.error("Error fetching allowed users:", error);
                } else if (data) {
                    setName(data[0]?.name || "");
                }
            }
        };

        checkSession();
    }, [router, supabase]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, theme: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFormData((prev) => ({
                ...prev,
                groupPhoto: e.target.files![0],
            }));
        }
    };

    const analyzeImage = async (file: File) => {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-pro",
            });

            // Convert the file to a base64 string
            const base64Image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const result = await model.generateContent([
                "Analyze this image and tell me: 1) How many people are in the image? 2) Is there at least one female in the image? Answer in the format: 'People: [number], Female: [yes/no]'",
                {
                    inlineData: {
                        data: base64Image.split(",")[1],
                        mimeType: file.type,
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text();

            console.log(text);

            const match = text.match(/People: (\d+), Female: (yes|no)/i);
            if (match) {
                return {
                    peopleCount: parseInt(match[1]),
                    hasFemale: match[2].toLowerCase() === "yes",
                };
            }
            throw new Error("Couldn't parse the API response");
        } catch (error) {
            console.error("Error analyzing image:", error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!formData.groupPhoto) {
                throw new Error("No group photo selected");
            }

            const imageAnalysis = await analyzeImage(formData.groupPhoto);

            if (imageAnalysis.peopleCount <= 2 || !imageAnalysis.hasFemale) {
                toast({
                    title: "Invalid Group Photo",
                    description:
                        imageAnalysis.peopleCount <= 2
                            ? "The image you uploaded doesn't seem to be a group photo."
                            : "Your group must include at least one female member.",
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }

            // Upload group photo
            let photoUrl = "";
            if (formData.groupPhoto) {
                const { data, error } = await supabase.storage
                    .from("group-photos")
                    .upload(
                        `${formData.teamName}-${Date.now()}.jpg`,
                        formData.groupPhoto
                    );
                if (error) throw error;
                photoUrl = data.path;
            }

            // Submit team data
            const { error } = await supabase.from("teams").insert([
                {
                    team_name: formData.teamName,
                    theme: formData.theme,
                    problem_statement_number: formData.problemStatementNumber,
                    problem_statement_title: formData.problemStatementTitle,
                    vegetarian_count: formData.vegetarianCount,
                    resources_required: formData.resources,
                    day_scholar_count: formData.dayScholarCount,
                    group_photo_url: photoUrl,
                    user_id: user?.id,
                },
            ]);

            if (error) throw error;

            toast({
                title: "Registration Successful",
                description: "Your team has been registered for the hackathon.",
            });
            router.push("/confirm/success");
        } catch (error) {
            console.error("Error submitting form:", error);
            toast({
                title: "Registration Failed",
                description:
                    "There was an error registering your team. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex justify-center items-center">
                Loading...
            </div>
        );
    }

    return (
        <section className="bg-white">
            <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
                <aside className="relative block lg:order-last lg:col-span-5 lg:h-full xl:col-span-6 px-6 py-6">
                    <div className="relative z-10">
                        <Alert
                            variant="default"
                            className="bg-gray-50 border-gray-200 mt-12"
                        >
                            <AlertTitle className="text-2xl font-bold text-gray-800 mb-4">
                                Important Notice: Hackathon Submission
                            </AlertTitle>
                            <AlertDescription>
                                <p className="text-gray-700 mb-4">
                                    Dear {name},
                                </p>
                                <p className="text-gray-700 mb-4">
                                    We&apos;re excited about your interest in
                                    the hackathon! Before you submit your form,
                                    please take a moment to review these
                                    important points:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                                    <li>
                                        <strong>
                                            Double-check your entries:
                                        </strong>{" "}
                                        Please ensure all information is
                                        accurate, as you won&apos;t be able to
                                        edit the form after submission.
                                    </li>
                                    <li>
                                        <strong>
                                            Commitment to participate:
                                        </strong>{" "}
                                        By submitting this form, you&apos;re
                                        confirming your commitment to
                                        participate in the hackathon and, if
                                        selected, to proceed to the national
                                        level competition.
                                    </li>
                                    <li>
                                        <strong>
                                            Limited spots available:
                                        </strong>{" "}
                                        We have only 25 slots available for this
                                        exciting opportunity. To make the most
                                        of these spots, we kindly ask that you
                                        submit only if you&apos;re fully
                                        committed to participating.
                                    </li>
                                </ul>
                                <p className="text-gray-700 mb-4">
                                    Thank you for your understanding and
                                    enthusiasm. We look forward to seeing your
                                    innovative ideas at the hackathon!
                                </p>
                                <p className="text-gray-700 font-semibold">
                                    Best of luck!
                                </p>
                            </AlertDescription>
                        </Alert>
                        <div className="p-4 bg-white rounded-md mt-4 flex flex-col space-y-4">
                            <Image
                                className="rounded-md"
                                alt="sample group photo"
                                width={1000}
                                height={500}
                                src="/group_photo.jpg"
                            ></Image>
                            <h1>A sample group photo</h1>
                        </div>
                    </div>
                    <div className="absolute inset-0 z-0">
                        <Image
                            alt=""
                            src="https://images.unsplash.com/photo-1605106325682-3482f7c1c9c4?q=80&w=1926&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            fill={true}
                            style={{ objectFit: "cover" }}
                            priority
                        />
                    </div>
                </aside>

                <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
                    <div className="max-w-xl lg:max-w-3xl">
                        <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
                            🤩 Confirm your team
                        </h1>

                        <p className="mt-4 leading-relaxed text-gray-500">
                            Remember: teamwork makes the dream work, but coffee
                            makes the team work. We&apos;ll provide the latter;
                            you bring the former.
                        </p>

                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col space-y-4 py-12 max-w-2xl mx-auto"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="teamName">Team Name</Label>
                                <Input
                                    id="teamName"
                                    name="teamName"
                                    value={formData.teamName}
                                    onChange={handleInputChange}
                                    placeholder="Code Crushers, InnovateX, Byte Busters, Algo Ninjas etc."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="theme">Hackathon Theme</Label>
                                <Select
                                    onValueChange={handleSelectChange}
                                    required
                                >
                                    <SelectTrigger
                                        id="theme"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Select Theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {themes.map((theme) => (
                                            <SelectItem
                                                key={theme}
                                                value={theme}
                                            >
                                                {theme}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="problemStatementNumber">
                                    Problem Statement Number
                                </Label>
                                <Input
                                    id="problemStatementNumber"
                                    name="problemStatementNumber"
                                    value={formData.problemStatementNumber}
                                    onChange={handleInputChange}
                                    placeholder="SIH1739"
                                    required
                                />
                            </div>

                            <div className="space-y-2 self-end">
                                <p className="text-xs">
                                    Get problem statement details{" "}
                                    <Link
                                        className="text-blue-600"
                                        target="_blank"
                                        href="https://sih.gov.in/sih2024PS"
                                    >
                                        here
                                    </Link>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="problemStatementTitle">
                                    Problem Statement Title
                                </Label>
                                <Input
                                    id="problemStatementTitle"
                                    name="problemStatementTitle"
                                    value={formData.problemStatementTitle}
                                    onChange={handleInputChange}
                                    placeholder="Building Integrated Photo-voltaic (BIPV) potential assessment and visualisation using LOD-1 3D City Model"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vegetarianCount">
                                    Number of Vegetarians
                                </Label>
                                <Input
                                    id="vegetarianCount"
                                    type="number"
                                    name="vegetarianCount"
                                    value={formData.vegetarianCount}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    required
                                    min="0"
                                    max="6"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resources">
                                    Required Resources (if any)
                                </Label>
                                <Textarea
                                    id="resources"
                                    name="resources"
                                    value={formData.resources}
                                    onChange={handleInputChange}
                                    placeholder="Private space for noise-sensitive audio processing"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dayScholarCount">
                                    Number of Day Scholars
                                </Label>
                                <Input
                                    id="dayScholarCount"
                                    type="number"
                                    name="dayScholarCount"
                                    value={formData.dayScholarCount}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    required
                                    min="0"
                                    max="6"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="groupPhoto">Group Photo</Label>
                                <Input
                                    id="groupPhoto"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? "Submitting..."
                                    : "Confirm Registration"}
                            </Button>
                        </form>
                    </div>
                </main>
            </div>
        </section>
    );
}
