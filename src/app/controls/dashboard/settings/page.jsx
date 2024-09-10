"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ChangePasswordForm = () => {
    const supabase = createClient();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match");
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <Card>
            <CardHeader>Change Password</CardHeader>
            <CardContent>
                {success ? (
                    <p>Password changed successfully!</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="text-red-500 mb-4">{error}</div>
                        )}
                        <Input
                            label="Current Password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current password"
                            required
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            required
                        />
                        <Button type="submit" className="mt-4">
                            Change Password
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
};

export default ChangePasswordForm;
