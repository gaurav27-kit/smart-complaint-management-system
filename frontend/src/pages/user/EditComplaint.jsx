import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ComplaintForm from "../../components/forms/ComplaintForm";
import Loading from "../../components/ui/Loading";
import { getComplaintById, updateComplaint } from "../../services/complaintService";
import Timeline from "../../components/common/Timeline";

const EditComplaint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setIsFetching(true);
        const data = await getComplaintById(id);
        setComplaint(data.complaint || data);
      } catch (error) {
        console.error("Failed to fetch complaint details:", error);
        toast.error("Failed to load complaint details. Please try again.");
        navigate("/dashboard/my-complaints");
      } finally {
        setIsFetching(false);
      }
    };

    fetchComplaint();
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    try {
      setIsUpdating(true);
      await updateComplaint(id, formData);
      toast.success("Complaint updated successfully!");
      navigate("/dashboard/my-complaints");
    } catch (error) {
      console.error("Failed to update complaint:", error);
      toast.error(
        error.response?.data?.message || "Failed to update complaint. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Loading message="Loading complaint details..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Complaint</h1>
        <p className="text-gray-500 mt-1">Make changes to your submitted complaint below.</p>
      </div>

      {complaint && (
        <div className="space-y-8">
          <ComplaintForm 
            onSubmit={handleSubmit} 
            initialData={complaint} 
            isLoading={isUpdating} 
          />

          {/* Timeline Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Activity History</h2>
            <Timeline 
              events={
                complaint.timeline 
                  ? [...complaint.timeline].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) 
                  : []
              } 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditComplaint;
