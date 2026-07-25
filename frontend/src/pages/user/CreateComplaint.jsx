import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ComplaintForm from "../../components/forms/ComplaintForm";
import { createComplaint } from "../../services/complaintService";

const CreateComplaint = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      await createComplaint(formData);
      toast.success("Complaint submitted successfully!");
      navigate("/dashboard/my-complaints");
    } catch (error) {
      console.error("Failed to submit complaint:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit complaint. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Complaint</h1>
        <p className="text-gray-500 mt-1">Please provide detailed information about the issue you are facing.</p>
      </div>

      <ComplaintForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
};

export default CreateComplaint;