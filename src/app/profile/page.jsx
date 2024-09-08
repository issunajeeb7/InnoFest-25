"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import { useSession } from "@/context/SessionContext";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function TeamDetails({ params }) {
    const [teamData, setTeamData] = useState(null);
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const [error, setError] = useState(null);
    const supabase = createClient();
    const { session, loading } = useSession();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
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
                fetchTeamMembers(data.id);
            } else {
                setError("No team data found");
            }
            setIsLoading(false);
        }

        fetchTeamData();
    }, [session, loading, supabase, router, fetchTeamMembers]);

    const generateAvatar = (name) => {
        const avatar = createAvatar(lorelei, {
            seed: name,
            size: 128,
        });
        return avatar.toDataUri();
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check for file size
            if (selectedFile.size > 15 * 1024 * 1024) {
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

            if (!validFileTypes.includes(selectedFile.type)) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload a PDF or PowerPoint file",
                    variant: "destructive",
                });
                return;
            }

            setFile(selectedFile); // Set the file if valid
        }
    };

    const handleUpload = async () => {
        if (!file || !teamData) return;

        setUploading(true);
        const fileExt = file.name.split(".").pop();
        const fileName = `${teamData.id}${Date.now()}_presentation.${fileExt}`;

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
                description: "Your presentation has been uploaded",
            });
            setTeamData({ ...teamData, presentation: fileName });
        }

        setUploading(false);
        setFile(null);
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
                            <Link href={"/profile/add-team"}>
                                <Button>Setup team</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="max-w-2xl">
                        <Table>
                            <TableCaption></TableCaption>
                            <TableBody>
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
                        {teamData.group_photo_url ? (
                            <Image
                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/group-photos/${teamData.group_photo_url}`}
                                alt="Group Photo"
                                width={600}
                                height={600}
                                className="w-full rounded-lg object-cover"
                            ></Image>
                        ) : (
                            <Label>No group photo uploaded</Label>
                        )}
                    </CardContent>
                </Card>
                <Card className="max-w-2xl w-full">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{teamData.team_name}</CardTitle>
                            <Link href={"/profile/add-team"}>
                                <Button>Edit team</Button>
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
                            <div>
                                <p>
                                    Current presentation:{" "}
                                    {teamData.presentation}
                                </p>
                                <p>
                                    Upload a new presentation to replace the
                                    current one:
                                </p>
                            </div>
                        ) : (
                            <p>
                                No presentation uploaded yet. Upload your team
                                presentation:
                            </p>
                        )}
                        <Input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.ppt,.pptx"
                            className="mt-2"
                        />
                        {file && (
                            <p className="mt-2">Selected file: {file.name}</p>
                        )}
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                        >
                            {uploading ? "Uploading..." : "Upload Presentation"}
                        </Button>
                    </CardFooter>
                </Card>
            </section>
        </section>
    );
}
