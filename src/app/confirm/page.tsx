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
import { useSession } from "@/context/SessionContext";
import Link from "next/link";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { sendConfirmationEmail } from "@/utils/sendEmail";

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
    const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
    const [totalTeamCount, setTotalTeamCount] = useState(0);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    const { session, loading } = useSession();

    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
            } else {
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

                // Check total team count
                const { data: teamsData, error: teamsError } = await supabase
                    .from("teams")
                    .select("id");

                if (!teamsError && teamsData) {
                    const count = teamsData.length;
                    setTotalTeamCount(count);
                    setIsRegistrationClosed(count >= 40);
                }

                setIsLoading(false);
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
        toast({
            title: "AI is verifying your group photo",
            description: "Please wait. It won't take much time.",
        });

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash-lite",
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
        
        // Check if registration is closed
        if (isRegistrationClosed) {
            toast({
                title: "Registration Closed",
                description: "Sorry, registration has been closed as we've reached our maximum capacity of 40 teams.",
                variant: "destructive",
            });
            return;
        }
        
        setIsSubmitting(true);
        try {
            let imageAnalysis;
            if (formData.groupPhoto) {
                imageAnalysis = await analyzeImage(formData.groupPhoto);
                if (
                    imageAnalysis.peopleCount <= 2 ||
                    !imageAnalysis.hasFemale
                ) {
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
            }

            // Upload group photo if provided
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

            // Check if registration is after the deadline (27/09/2025 11:59 PM IST)
            const deadlineDate = new Date('2025-09-27T23:59:00+05:30'); // IST timezone
            const currentDate = new Date();
            const isAfterDeadline = currentDate > deadlineDate;

            // Prepare team data, including optional fields
            const teamData = {
                team_name: formData.teamName,
                theme: formData.theme,
                problem_statement_number: formData.problemStatementNumber,
                problem_statement_title: formData.problemStatementTitle,
                user_id: user?.id,
                waiting_list: isAfterDeadline, // Set to true if registering after deadline
                // Include optional fields only if they have values
                ...(formData.vegetarianCount !== undefined && {
                    vegetarian_count: formData.vegetarianCount,
                }),
                ...(formData.resources && {
                    resources_required: formData.resources,
                }),
                ...(formData.dayScholarCount !== undefined && {
                    day_scholar_count: formData.dayScholarCount,
                }),
                ...(photoUrl && { group_photo_url: photoUrl }),
            };

            // Submit team data
            const { error } = await supabase.from("teams").insert([teamData]);
            if (error) throw error;

            await sendConfirmationEmail({
                to: user?.email as string,
                teamName: formData.teamName,
                theme: formData.theme,
                problemStatementNumber: formData.problemStatementNumber,
                problemStatementTitle: formData.problemStatementTitle,
            });

            toast({
                title: "Registration Successful",
                description: "Your team has been registered for the hackathon.",
            });
            router.push("/confirm/success");
        } catch (error: any) {
            console.error("Error submitting form:", error);
            if (error.message.includes("Email")) {
                toast({
                    title: "Email Sending Failed",
                    description:
                        "We couldn't send you a confirmation email, but your submission was successful. Please check your registration details on the dashboard.",
                    variant: "default",
                });
            } else if (
                error.code === "23505" ||
                error.message.includes(
                    "duplicate key value violates unique constraint"
                )
            ) {
                toast({
                    title: "Duplicate submission",
                    description: "You have already confirmed your slot.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Registration Failed",
                    description:
                        "There was an error registering your team. Please try again.",
                    variant: "destructive",
                });
            }
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
            <header className="bg-white shadow-md">
                <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
                    <Link
                        className="text-gray-600 flex items-center space-x-4"
                        href="/"
                    >
                        <span className="sr-only">Home</span>
                        <svg
                            className="h-8 sm:h-10"
                            viewBox="0 0 51 50"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M50.0954 3.0813C50.0921 2.93266 50.0865 2.78403 50.081 2.63483C50.0748 2.46838 50.0698 2.30249 50.0609 2.13548C50.0437 1.80035 50.022 1.46355 49.9936 1.12563C49.9485 0.583972 49.5181 0.154204 48.9765 0.108555C48.6386 0.0801639 48.3029 0.0590095 47.9683 0.0411953C47.7985 0.0322882 47.6304 0.027278 47.4623 0.0211544C47.3164 0.0161441 47.17 0.0100205 47.0247 0.00723702C46.7814 0.00167008 46.5398 0 46.2988 0C46.2587 0 46.2181 1.10173e-09 46.178 0.000556695C41.3748 0.0239378 36.9658 1.20302 32.5145 3.63354C32.436 3.67696 32.3575 3.7176 32.279 3.76047C32.2512 3.77605 32.2239 3.78941 32.1961 3.805C32.1899 3.80834 32.1849 3.81391 32.1788 3.81725C28.5291 5.85141 24.8856 8.72228 21.1145 12.4933C20.6859 12.922 20.2667 13.3562 19.8519 13.7926L12.5236 14.3499C12.3093 14.366 12.1044 14.444 11.9335 14.5737L0.439474 23.321C0.0737261 23.5994 -0.0838183 24.0737 0.0436646 24.5151C0.170591 24.9566 0.555823 25.2744 1.01342 25.3162L11.7983 26.2899L15.213 29.7046C14.0028 29.9813 12.7697 30.6593 11.7136 31.7148C11.0812 32.3478 10.5735 33.057 10.2017 33.8319C9.71566 34.8613 8.64848 37.5117 7.51839 40.318L6.96671 41.6869C6.7997 42.1011 6.89601 42.5748 7.21221 42.8905C7.42487 43.1037 7.70989 43.2167 7.99993 43.2167C8.13966 43.2167 8.28106 43.19 8.41634 43.1354L9.83424 42.5637C12.6177 41.4425 15.247 40.3831 16.2785 39.8971C17.0468 39.5275 17.7565 39.0198 18.3884 38.3879C19.4439 37.3324 20.1214 36.0994 20.3981 34.8891L23.7115 38.2025L24.6852 48.9868C24.7263 49.4444 25.0448 49.8297 25.4862 49.9566C25.5881 49.9861 25.6917 50 25.7941 50C26.1359 50 26.466 49.8425 26.6803 49.5608L35.4266 38.0673C35.5563 37.8964 35.6342 37.6915 35.6503 37.4772L36.1909 30.3654C36.668 29.9139 37.1406 29.4552 37.6088 28.9876C41.3826 25.2138 44.2552 21.5685 46.2899 17.9166C46.2921 17.9127 46.2954 17.9094 46.2977 17.9055C46.3077 17.8877 46.316 17.8704 46.3261 17.8526C46.419 17.685 46.5075 17.5175 46.5966 17.3494C48.9386 12.981 50.0765 8.64545 50.101 3.9336C50.1016 3.88739 50.1016 3.84174 50.1016 3.79554C50.1027 3.55894 50.101 3.32068 50.0954 3.0813ZM35.8608 20.8192C34.9829 21.6971 33.8149 22.1815 32.5724 22.1815C31.3304 22.1815 30.1625 21.6977 29.284 20.8192C27.4708 19.0055 27.4708 16.0556 29.284 14.2419C31.0983 12.4287 34.0487 12.4299 35.8608 14.2419C36.7392 15.1198 37.2236 16.2877 37.2236 17.5303C37.2236 18.7728 36.7398 19.9408 35.8608 20.8192Z"
                                fill="currentColor"
                            />
                        </svg>
                        <div className="text-3xl font-bold hidden md:block">
                            <span className="font-normal">DUK</span>
                            InnoFest&apos;25
                        </div>
                        <div className="text-xl font-bold md:hidden">
                            <span className="font-normal">DUK</span>
                            InnoFest&apos;25
                        </div>
                    </Link>

                    <div className="flex flex-1 items-center justify-end md:justify-end">
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex sm:gap-4">
                                {session ? (
                                    <>
                                        <Link
                                            className="block rounded-md border-2 border-gray-800 px-5 py-2.5 text-sm font-medium text-black transition hover:border-gray-700"
                                            href="/"
                                        >
                                            Home
                                        </Link>
                                        <Link
                                            className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                            href="/logout"
                                        >
                                            Logout
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                            href="/login"
                                        >
                                            Login
                                        </Link>

                                        <Link
                                            className="hidden rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:text-gray-600/75 sm:block"
                                            href="/signup"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </div>
                            <Sheet>
                                <SheetTrigger className="md:hidden">
                                    <span className="sr-only">Toggle menu</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="size-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Menu</SheetTitle>
                                        <SheetDescription className="flex flex-col space-y-4">
                                            {session ? (
                                                <>
                                                    <Link
                                                        className="block rounded-md border-2 border-gray-800 px-5 py-2.5 text-sm font-medium text-black transition hover:border-gray-700"
                                                        href="/"
                                                    >
                                                        Home
                                                    </Link>
                                                    <Link
                                                        className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                                        href="/logout"
                                                    >
                                                        Logout
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                                        href="/login"
                                                    >
                                                        Login
                                                    </Link>

                                                    <Link
                                                        className="hidden rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:text-gray-600/75 sm:block"
                                                        href="/signup"
                                                    >
                                                        Register
                                                    </Link>
                                                </>
                                            )}
                                        </SheetDescription>
                                    </SheetHeader>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>
            <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
                <aside className="relative block lg:order-last lg:col-span-5 lg:h-full xl:col-span-6 px-6 py-6">
                    <div className="relative z-10">
                        <Alert
                            variant="default"
                            className="bg-gray-50 border-gray-200 mt-12"
                        >
                            <AlertTitle className="text-2xl font-bold text-gray-800 mb-4">
                                Congratulations {name}!
                            </AlertTitle>
                            <AlertDescription>
                                
                                <p className="text-gray-700 mb-4">
                                    You&apos;ve taken the first step towards an
                                    amazing hackathon experience. Your
                                    creativity and determination will shine
                                    bright! Remember, every great innovation
                                    starts with a single idea. Embrace the
                                    challenges, learn from each other, and most
                                    importantly, have fun! We can&apos;t wait to
                                    see what incredible solutions you&apos;ll
                                    come up with. Good luck and happy hacking!
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
                            🤩 Add your team profile
                        </h1>

                        <p className="mt-4 leading-relaxed text-gray-500">
                            Remember: teamwork makes the dream work, but coffee
                            makes the team work. We&apos;ll provide the latter;
                            you bring the former.
                        </p>

                        {!isRegistrationClosed && (
                            <Alert variant="default" className="mt-4 bg-yellow-50 border-yellow-200">
                                <AlertDescription className="text-yellow-800">
                                    ⚠️ <strong>Notice:</strong> Late to the party? That's okay! Join our <b>waitlist</b> and get notified if a spot opens up.
                                </AlertDescription>
                            </Alert>
                        )}

                        {isRegistrationClosed && (
                            <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200">
                                <AlertDescription className="text-red-800">
                                    🚫 <strong>Registration Closed!</strong> Sorry, you're late to the party! We've reached our maximum capacity. Thanks for your interest in DUKInnoFest'25!
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isRegistrationClosed && (
                            <form
                            onSubmit={handleSubmit}
                            className="flex flex-col space-y-4 py-12 max-w-2xl mx-auto"
                        >
                            <p className="text-xs">
                                Fields marked with{" "}
                                <span className="text-red-500">*</span> are
                                required
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="teamName">
                                    Team Name{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
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
                                <Label htmlFor="theme">
                                    Hackathon Theme{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
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
                                    Problem Statement Number{" "}
                                    <span className="text-red-500">*</span>
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
                                        href="https://sih.gov.in/sih2025PS"
                                    >
                                        here
                                    </Link>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="problemStatementTitle">
                                    Problem Statement Title{" "}
                                    <span className="text-red-500">*</span>
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
                                />
                            </div>

                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? "AI is verifying your submission..."
                                    : "Confirm Registration"}
                            </Button>
                        </form>
                        )}
                    </div>
                </main>
            </div>
        </section>
    );
}
