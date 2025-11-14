"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/context/SessionContext";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";

const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY
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

export default function TeamDetails({ params }) {
    const [teamData, setTeamData] = useState(null);
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        theme: "",
        problem_statement_number: "",
        problem_statement_title: "",
        vegetarian_count: 0,
        day_scholar_count: 0,
        resources_required: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const [error, setError] = useState(null);
    const supabase = createClient();
    const { session, loading } = useSession();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [groupPhotoFile, setGroupPhotoFile] = useState(null);
    const [uploadingGroupPhoto, setUploadingGroupPhoto] = useState(false);
    const { toast } = useToast();

    const fetchTeamMembers = useCallback(
        async (teamId) => {
            const { data, error } = await supabase
                .from("team_members")
                .select("*")
                .eq("team_id", teamId);

            if (error) {
                console.error("Error fetching team members:", error);
                setError("Failed to fetch team members");
            } else {
                setMembers(data || []);
            }
        },
        [supabase]
    );

    useEffect(() => {
        if (!session && !loading) {
            router.push("/");
            return;
        }

        async function fetchTeamData() {
            if (!session) return;

            const { data, error } = await supabase
                .from("teams")
                .select("*")
                .eq("user_id", session.user.id)
                .single();

            if (error) {
                console.error("Error fetching team data:", error);
                setError("Failed to fetch team data");
            } else if (data) {
                setTeamData(data);
                // Populate edit form data
                setEditFormData({
                    theme: data.theme || "",
                    problem_statement_number: data.problem_statement_number || "",
                    problem_statement_title: data.problem_statement_title || "",
                    vegetarian_count: data.vegetarian_count || 0,
                    day_scholar_count: data.day_scholar_count || 0,
                    resources_required: data.resources_required || "",
                });
                fetchTeamMembers(data.id);
            } else {
                setError("No team data found");
            }
            setIsLoading(false);
        }

        fetchTeamData();
    }, [session, loading, supabase, router, fetchTeamMembers]);

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset form data to original values if canceling
            setEditFormData({
                theme: teamData.theme || "",
                problem_statement_number: teamData.problem_statement_number || "",
                problem_statement_title: teamData.problem_statement_title || "",
                vegetarian_count: teamData.vegetarian_count || 0,
                day_scholar_count: teamData.day_scholar_count || 0,
                resources_required: teamData.resources_required || "",
            });
        }
        setIsEditing(!isEditing);
    };

    const handleEditInputChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("teams")
                .update({
                    theme: editFormData.theme,
                    problem_statement_number: editFormData.problem_statement_number,
                    problem_statement_title: editFormData.problem_statement_title,
                    vegetarian_count: editFormData.vegetarian_count,
                    day_scholar_count: editFormData.day_scholar_count,
                    resources_required: editFormData.resources_required,
                })
                .eq("id", teamData.id);

            if (error) throw error;

            // Update local team data
            setTeamData(prev => ({
                ...prev,
                ...editFormData
            }));

            setIsEditing(false);
            toast({
                title: "Success",
                description: "Team details updated successfully",
            });
        } catch (error) {
            console.error("Error updating team details:", error);
            toast({
                title: "Error",
                description: "Failed to update team details. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const generateAvatar = (name) => {
        const avatar = createAvatar(lorelei, {
            seed: name,
            size: 128,
        });
        return avatar.toDataUri();
    };

    const analyzeImage = async (file) => {
        toast({
            title: "AI is verifying your group photo",
            description: "Please wait. It won't take much time.",
        });

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash-lite",
            });

            // Convert the file to a base64 string
            const base64Image = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
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

    const handleFileChange = (file) => {
        setFile(file);
        if (file) {
            // Check for file size
            if (file[0].size > 15 * 1024 * 1024) {
                // 15MB limit
                toast({
                    title: "File too large",
                    description: "Maximum file size is 15MB",
                    variant: "destructive",
                });
                return;
            }

            // Check for valid file types: PDF or PowerPoint (ppt or pptx)
            const validFileTypes = [
                "application/pdf", // PDF
                "application/vnd.ms-powerpoint", // PPT
                "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
            ];

            if (!validFileTypes.includes(file[0].type)) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload a PDF or PowerPoint file",
                    variant: "destructive",
                });
                return;
            }

            setFile(file[0]); // Set the file if valid
        }
    };

    const handleGroupPhotoChange = (file) => {
        setGroupPhotoFile(file);
        if (file) {
            // Check for file size
            if (file[0].size > 10 * 1024 * 1024) {
                // 10MB limit for images
                toast({
                    title: "File too large",
                    description: "Maximum file size is 10MB",
                    variant: "destructive",
                });
                return;
            }

            // Check for valid image file types
            const validImageTypes = [
                "image/jpeg",
                "image/jpg", 
                "image/png",
                "image/webp"
            ];

            if (!validImageTypes.includes(file[0].type)) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload a JPEG, PNG, or WebP image",
                    variant: "destructive",
                });
                return;
            }

            setGroupPhotoFile(file[0]); // Set the file if valid
        }
    };

    const handleUpload = async () => {
        if (!file || !teamData) return;

        setUploading(true);
        const fileExt = file.name.split(".").pop();
        const fileName = `${
            teamData.team_name
        }${Date.now()}_presentation.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("presentation")
            .upload(fileName, file);

        if (uploadError) {
            toast({
                title: "Upload failed",
                description: "There was an error uploading your file",
                variant: "destructive",
            });
            setUploading(false);
            return;
        }

        const { error: updateError } = await supabase
            .from("teams")
            .update({ presentation: fileName })
            .eq("id", teamData.id);

        if (updateError) {
            toast({
                title: "Update failed",
                description:
                    "There was an error updating your team information",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Upload successful",
                description: (
                    <div className="space-y-2">
                        <p>Your presentation has been uploaded successfully!</p>
                        <p className="font-semibold">Thank you for participating in DUK Innofest&apos;25 - we will miss you! 🎉</p>
                        <img 
                            src="/thank-you.gif"
                            alt="Thank you"
                            className="w-full rounded-lg mt-2"
                        />
                    </div>
                ),
                duration: 8000,
            });
            setTeamData({ ...teamData, presentation: fileName });
        }

        setUploading(false);
        setFile(null);
    };

    const handleGroupPhotoUpload = async () => {
        if (!groupPhotoFile || !teamData) return;

        setUploadingGroupPhoto(true);
        
        try {
            // Analyze the image with Gemini first
            const imageAnalysis = await analyzeImage(groupPhotoFile);
            
            if (imageAnalysis.peopleCount <= 2 || !imageAnalysis.hasFemale) {
                toast({
                    title: "Invalid Group Photo",
                    description:
                        imageAnalysis.peopleCount <= 2
                            ? "The image you uploaded doesn't seem to be a group photo."
                            : "Your group must include at least one female member.",
                    variant: "destructive",
                });
                setUploadingGroupPhoto(false);
                setGroupPhotoFile(null);
                return;
            }

            const fileExt = groupPhotoFile.name.split(".").pop();
            const fileName = `${teamData.team_name}_${Date.now()}_group_photo.${fileExt}`;

            // Delete old group photo if it exists
            if (teamData.group_photo_url) {
                await supabase.storage
                    .from("group-photos")
                    .remove([teamData.group_photo_url]);
            }

            const { error: uploadError } = await supabase.storage
                .from("group-photos")
                .upload(fileName, groupPhotoFile);

            if (uploadError) {
                toast({
                    title: "Upload failed",
                    description: "There was an error uploading your group photo",
                    variant: "destructive",
                });
                setUploadingGroupPhoto(false);
                return;
            }

            const { error: updateError } = await supabase
                .from("teams")
                .update({ group_photo_url: fileName })
                .eq("id", teamData.id);

            if (updateError) {
                toast({
                    title: "Update failed",
                    description: "There was an error updating your team information",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Upload successful",
                    description: "Your group photo has been uploaded and verified",
                });
                setTeamData({ ...teamData, group_photo_url: fileName });
            }
        } catch (error) {
            console.error("Error in group photo upload:", error);
            toast({
                title: "Analysis failed",
                description: "There was an error analyzing your group photo. Please try again.",
                variant: "destructive",
            });
        }

        setUploadingGroupPhoto(false);
        setGroupPhotoFile(null);
    };

    if (loading || isLoading) return <div>Loading team details...</div>;
    if (error)
        return (
            <div className="mx-auto flex max-w-screen-xl justify-center lg:h-screen py-12 items-center gap-8 px-4 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            There was an error retrieving your registration
                            details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            We couldn&apos;t find your team information. If you
                            haven&apos;t registered yet, please do so.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start space-y-4">
                        <p>
                            <Link href={"/confirm"}>
                                <Button>Register your team</Button>
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        );
    if (!teamData) return <div>No team data found</div>;

    return (
        <section>
            <Header></Header>
            <section className="mx-auto flex flex-col lg:flex-row max-w-screen-xl justify-center py-12 items-center gap-8 px-4 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{teamData.team_name}</CardTitle>
                            <div className="flex gap-4">
                                <Link href={"/profile/add-team"}>
                                    <Button variant="outline">Setup Team</Button>
                                </Link>
                                {!isEditing && (
                                    <Button onClick={handleEditToggle} className="min-w-[120px]">Edit Details</Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="max-w-2xl">
                        {isEditing ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-theme">Theme *</Label>
                                    <Select
                                        value={editFormData.theme}
                                        onValueChange={(value) => handleEditInputChange('theme', value)}
                                    >
                                        <SelectTrigger id="edit-theme">
                                            <SelectValue placeholder="Select Theme" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {themes.map((theme) => (
                                                <SelectItem key={theme} value={theme}>
                                                    {theme}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-ps-number">Problem Statement Number *</Label>
                                    <Input
                                        id="edit-ps-number"
                                        value={editFormData.problem_statement_number}
                                        onChange={(e) => handleEditInputChange('problem_statement_number', e.target.value)}
                                        placeholder="SIH1739"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-ps-title">Problem Statement Title *</Label>
                                    <Input
                                        id="edit-ps-title"
                                        value={editFormData.problem_statement_title}
                                        onChange={(e) => handleEditInputChange('problem_statement_title', e.target.value)}
                                        placeholder="Problem statement title"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-veg-count">Number of Vegetarians</Label>
                                    <Input
                                        id="edit-veg-count"
                                        type="number"
                                        min="0"
                                        max="6"
                                        value={editFormData.vegetarian_count}
                                        onChange={(e) => handleEditInputChange('vegetarian_count', parseInt(e.target.value) || 0)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-scholar-count">Number of Day Scholars</Label>
                                    <Input
                                        id="edit-scholar-count"
                                        type="number"
                                        min="0"
                                        max="6"
                                        value={editFormData.day_scholar_count}
                                        onChange={(e) => handleEditInputChange('day_scholar_count', parseInt(e.target.value) || 0)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-resources">Resources Required</Label>
                                    <Textarea
                                        id="edit-resources"
                                        value={editFormData.resources_required}
                                        onChange={(e) => handleEditInputChange('resources_required', e.target.value)}
                                        placeholder="List any special resources required"
                                    />
                                </div>

                                {/* Action buttons at the bottom */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-end pt-8 border-t mt-8 px-4">
                                    <Button
                                        variant="destructive"
                                        onClick={handleEditToggle}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto min-w-[140px] order-2 sm:order-1 !bg-red-600 !border-red-600 !text-white hover:!bg-red-700 hover:!border-red-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handleSaveChanges}
                                        disabled={isSaving}
                                        className="w-full sm:w-auto min-w-[140px] order-1 sm:order-2 !bg-green-600 !border-green-600 !text-white hover:!bg-green-700 hover:!border-green-700"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableCaption></TableCaption>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-bold">
                                            Room allotted
                                        </TableCell>
                                        <TableCell>
                                            {teamData.room_allotted}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-bold">
                                            Theme
                                        </TableCell>
                                        <TableCell>{teamData.theme}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-bold">
                                            Problem Statement Number
                                        </TableCell>
                                        <TableCell>
                                            {teamData.problem_statement_number}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-bold">
                                            Problem Statement Title
                                        </TableCell>
                                        <TableCell>
                                            {teamData.problem_statement_title}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Vegetarian Count</TableCell>
                                        <TableCell>
                                            {teamData.vegetarian_count}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Day Scholar Count</TableCell>
                                        <TableCell>
                                            {teamData.day_scholar_count}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Resources Required</TableCell>
                                        <TableCell>
                                            {teamData.resources_required || "None"}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Confirmed</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        )}
                        
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3">Group Photo</h3>
                            {teamData.group_photo_url ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/group-photos/${teamData.group_photo_url}`}
                                            alt="Group Photo"
                                            width={600}
                                            height={600}
                                            className="w-full rounded-lg object-cover"
                                        />
                                        <Button
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => document.getElementById('group-photo-input').click()}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                    <input
                                        id="group-photo-input"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={(e) => handleGroupPhotoChange(e.target.files)}
                                        className="hidden"
                                    />
                                    {groupPhotoFile && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm">Selected: {groupPhotoFile.name}</p>
                                            <Button
                                                onClick={handleGroupPhotoUpload}
                                                disabled={!groupPhotoFile || uploadingGroupPhoto}
                                                size="sm"
                                            >
                                                {uploadingGroupPhoto ? "Uploading..." : "Update Photo"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-gray-600">
                                            {groupPhotoFile ? `Selected: ${groupPhotoFile.name}` : "No group photo uploaded yet."}
                                        </Label>
                                        <Button
                                            size="sm"
                                            onClick={groupPhotoFile ? handleGroupPhotoUpload : () => document.getElementById('group-photo-input').click()}
                                            disabled={uploadingGroupPhoto}
                                            className={groupPhotoFile ? "!bg-green-600 hover:!bg-green-700 !text-white !border-green-600" : ""}
                                        >
                                            {uploadingGroupPhoto ? "Uploading..." : (groupPhotoFile ? "Upload" : "Upload Photo")}
                                        </Button>
                                    </div>
                                    <input
                                        id="group-photo-input"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={(e) => handleGroupPhotoChange(e.target.files)}
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="max-w-2xl w-full">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{teamData.team_name}</CardTitle>
                            <Link href={"/profile/add-team"}>
                                <Button>Setup Team</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {members.map((member, index) => (
                                <div
                                    key={index}
                                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                                >
                                    <Avatar>
                                        <AvatarImage
                                            src={generateAvatar(
                                                member.full_name
                                            )}
                                            alt={member.full_name}
                                        />
                                        <AvatarFallback>
                                            {member.full_name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Label className="text-sm font-medium truncate">
                                        {member.full_name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="max-w-2xl w-full">
                    <CardHeader>
                        <CardTitle>Team Presentation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {teamData.presentation ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-green-800 mb-1">
                                                Current Presentation
                                            </p>
                                            <p className="text-sm text-green-700 break-all">
                                                {teamData.presentation}
                                            </p>
                                        </div>
                                        <Link
                                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/presentation/${teamData.presentation}`}
                                            target="_blank"
                                        >
                                            <Button size="sm" variant="outline" className="ml-2">
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Upload a new presentation to replace the current one
                                </p>
                                <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
                                    <FileUpload onChange={handleFileChange} />
                                </div>
                                {file && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            New file selected: <span className="font-semibold">{file.name}</span>
                                        </p>
                                        <Button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            size="sm"
                                            className="!bg-green-600 hover:!bg-green-700 !text-white !border-green-600"
                                        >
                                            {uploading ? "Uploading..." : "Replace Presentation"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-gray-600">No presentation uploaded yet.</p>
                                <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
                                    <FileUpload onChange={handleFileChange} />
                                </div>
                                {file && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            Selected: <span className="font-semibold">{file.name}</span>
                                        </p>
                                        <Button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            size="sm"
                                            className="!bg-green-600 hover:!bg-green-700 !text-white !border-green-600"
                                        >
                                            {uploading ? "Uploading..." : "Upload"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </section>
    );
}
