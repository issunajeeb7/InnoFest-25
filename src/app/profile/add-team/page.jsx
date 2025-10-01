"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, UserPlus, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

const supabase = createClient();

export default function TeamRegistrationForm() {
    const { session } = useSession();
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamId, setTeamId] = useState(null);
    const router = useRouter();
    const { toast } = useToast();

    const fetchOrCreateTeam = useCallback(async () => {
        if (!session) return;

        const { data: existingTeam, error: fetchError } = await supabase
            .from("teams")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

        if (existingTeam) {
            setTeamId(existingTeam.id);
        } else {
            router.push("/");
        }
    }, [session, router]);

    const loadTeamMembers = useCallback(async () => {
        if (!teamId || !session) return;

        try {
            const storedMembers = localStorage.getItem(`teamMembers_${teamId}`);
            if (storedMembers) {
                setTeamMembers(JSON.parse(storedMembers));
                return;
            }
        } catch (error) {
            console.error("Error accessing local storage:", error);
        }

        const { data: members, error } = await supabase
            .from("team_members")
            .select("*")
            .eq("team_id", teamId);

        if (members && members.length > 0) {
            setTeamMembers(members);
            try {
                localStorage.setItem(
                    `teamMembers_${teamId}`,
                    JSON.stringify(members)
                );
            } catch (error) {
                console.error("Error saving to local storage:", error);
            }
        } else if (error) {
            console.error("Error loading team members:", error);
        } else {
            const initialMembers = [
                {
                    full_name: "",
                    email: session.user.email,
                    gender: null,
                    is_leader: true,
                    mobile_number: "",
                    course: null,
                },
            ];
            setTeamMembers(initialMembers);
            try {
                localStorage.setItem(
                    `teamMembers_${teamId}`,
                    JSON.stringify(initialMembers)
                );
            } catch (error) {
                console.error("Error saving to local storage:", error);
            }
        }
    }, [teamId, session]);

    useEffect(() => {
        if (session) {
            fetchOrCreateTeam();
        }
    }, [session, fetchOrCreateTeam]);

    useEffect(() => {
        if (teamId) {
            loadTeamMembers();
        }
    }, [teamId, loadTeamMembers]);

    const handleMemberChange = (index, field, value) => {
        const updatedMembers = [...teamMembers];
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        setTeamMembers(updatedMembers);
        try {
            localStorage.setItem(
                `teamMembers_${teamId}`,
                JSON.stringify(updatedMembers)
            );
        } catch (error) {
            console.error("Error saving to local storage:", error);
        }
    };

    const addTeamMember = () => {
        if (teamMembers.length < 6) {
            const updatedMembers = [
                ...teamMembers,
                {
                    full_name: "",
                    email: "",
                    gender: null,
                    is_leader: false,
                    mobile_number: "",
                    course: null,
                },
            ];
            setTeamMembers(updatedMembers);
            // Save to local storage
            localStorage.setItem(
                `teamMembers_${teamId}`,
                JSON.stringify(updatedMembers)
            );
        }
    };

    const removeTeamMember = (index) => {
        const updatedMembers = teamMembers.filter((_, i) => i !== index);
        setTeamMembers(updatedMembers);
        // Save to local storage
        localStorage.setItem(
            `teamMembers_${teamId}`,
            JSON.stringify(updatedMembers)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session || !teamId) return;

        try {
            const { data: existingMembers, error: fetchError } = await supabase
                .from("team_members")
                .select("id, email")
                .eq("team_id", teamId);

            if (fetchError) throw fetchError;

            const membersToInsert = [];
            const membersToUpdate = [];
            const memberIdsToKeep = new Set();

            const uniqueTeamMembers = teamMembers.filter(
                (member, index, self) =>
                    index === self.findIndex((m) => m.email === member.email)
            );

            const currentTime = new Date().toISOString();

            uniqueTeamMembers.forEach((member) => {
                const existingMember = existingMembers.find(
                    (em) => em.email === member.email
                );
                if (existingMember) {
                    membersToUpdate.push({
                        ...member,
                        id: existingMember.id,
                        team_id: teamId,
                        created_at: currentTime, // Add this line
                    });
                    memberIdsToKeep.add(existingMember.id);
                } else {
                    membersToInsert.push({
                        ...member,
                        team_id: teamId,
                        created_at: currentTime, // Add this line
                    });
                }
            });

            const memberIdsToDelete = existingMembers
                .filter((em) => !memberIdsToKeep.has(em.id))
                .map((em) => em.id);

            if (membersToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from("team_members")
                    .insert(membersToInsert);
                if (insertError) throw insertError;
            }

            if (membersToUpdate.length > 0) {
                const { error: updateError } = await supabase
                    .from("team_members")
                    .upsert(membersToUpdate, { onConflict: ["id"] });
                if (updateError) throw updateError;
            }

            if (memberIdsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from("team_members")
                    .delete()
                    .in("id", memberIdsToDelete);
                if (deleteError) throw deleteError;
            }

            toast({
                title: "Updated successfully!",
                description: "Team members updated successfully!",
            });
            loadTeamMembers();
            router.push("/profile");
        } catch (error) {
            console.error("Error updating team members:", error);
            toast({
                title: "Failed to update!",
                description: "Failed to update team members. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-8">
                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl mx-auto space-y-4"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {teamMembers.map((member, index) => (
                                <div key={index} className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold mt-4">
                                            {member.is_leader
                                                ? "Team Leader"
                                                : `Member ${index + 1}`}
                                        </h3>
                                        {!member.is_leader && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    removeTeamMember(index)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`full_name_${index}`}>
                                            Full Name
                                        </Label>
                                        <Input
                                            id={`full_name_${index}`}
                                            value={member.full_name}
                                            onChange={(e) =>
                                                handleMemberChange(
                                                    index,
                                                    "full_name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Full name"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`email_${index}`}>
                                            Email
                                        </Label>
                                        <Input
                                            id={`email_${index}`}
                                            value={member.email}
                                            onChange={(e) =>
                                                handleMemberChange(
                                                    index,
                                                    "email",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Email"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`gender_${index}`}>
                                            Gender
                                        </Label>
                                        <Select
                                            onValueChange={(value) =>
                                                handleMemberChange(
                                                    index,
                                                    "gender",
                                                    value
                                                )
                                            }
                                            placeholder={"Gender"}
                                            defaultValue={member.gender}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">
                                                    Male
                                                </SelectItem>
                                                <SelectItem value="Female">
                                                    Female
                                                </SelectItem>
                                                <SelectItem value="Other">
                                                    Other
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`mobile_number_${index}`}>
                                            Phone Number
                                        </Label>
                                        <Input
                                            id={`mobile_number_${index}`}
                                            value={member.mobile_number}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d{0,10}$/.test(value)) {
                                                    handleMemberChange(
                                                        index,
                                                        "mobile_number",
                                                        value
                                                    );
                                                }
                                            }}
                                            placeholder="10-digit phone number"
                                            required
                                            pattern="\d{10}"
                                            title="Please enter a 10-digit phone number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`course_${index}`}>
                                            Course
                                        </Label>
                                        <Select
                                            onValueChange={(value) =>
                                                handleMemberChange(
                                                    index,
                                                    "course",
                                                    value
                                                )
                                            }
                                            defaultValue={member.course}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select course" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M.Tech. Computer Science and Engineering, Artificial Intelligence">M.Tech. Computer Science and Engineering, Artificial Intelligence</SelectItem>
                                                <SelectItem value="M.Tech. Computer Science and Engineering, Connected Systems and Intelligence">M.Tech. Computer Science and Engineering, Connected Systems and Intelligence</SelectItem>
                                                <SelectItem value="M.Tech. Computer Science and Engineering, Cybersecurity Engineering">M.Tech. Computer Science and Engineering, Cybersecurity Engineering</SelectItem>
                                                <SelectItem value="M.Tech. Electronics Engineering, AI Hardware">M.Tech. Electronics Engineering, AI Hardware</SelectItem>
                                                <SelectItem value="M.Tech. Electronics Engineering, IoT and Robotics">M.Tech. Electronics Engineering, IoT and Robotics</SelectItem>
                                                <SelectItem value="M.Tech. Electronics Engineering, VLSI Design">M.Tech. Electronics Engineering, VLSI Design</SelectItem>
                                                <SelectItem value="M.Tech. Electronic Product Design">M.Tech. Electronic Product Design</SelectItem>
                                                <SelectItem value="M.Sc. Applied Physics">M.Sc. Applied Physics</SelectItem>
                                                <SelectItem value="M.Sc. Computer Science, Artificial Intelligence">M.Sc. Computer Science, Artificial Intelligence</SelectItem>
                                                <SelectItem value="M.Sc. Computer Science, Cybersecurity">M.Sc. Computer Science, Cybersecurity</SelectItem>
                                                <SelectItem value="M.Sc. Computer Science, Data Analytics">M.Sc. Computer Science, Data Analytics</SelectItem>
                                                <SelectItem value="M.Sc. Data Analytics and Computational Science">M.Sc. Data Analytics and Computational Science</SelectItem>
                                                <SelectItem value="M.Sc. Data Science and Bio-AI">M.Sc. Data Science and Bio-AI</SelectItem>
                                                <SelectItem value="M.Sc. Data Science and Geoinformatics">M.Sc. Data Science and Geoinformatics</SelectItem>
                                                <SelectItem value="M.Sc. Ecology, Ecological Informatics">M.Sc. Ecology, Ecological Informatics</SelectItem>
                                                <SelectItem value="M.Sc. Electronics">M.Sc. Electronics</SelectItem>
                                                <SelectItem value="M.Sc. Environmental Science">M.Sc. Environmental Science</SelectItem>
                                                <SelectItem value="MBA">MBA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Separator />
                                </div>
                            ))}
                            {teamMembers.length < 6 && (
                                <Button
                                    className="mt-4"
                                    onClick={addTeamMember}
                                    type="button"
                                    variant="outline"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Team Member
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Button type="submit" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Update Team Members
                    </Button>
                </form>
            </main>
        </>
    );
}
