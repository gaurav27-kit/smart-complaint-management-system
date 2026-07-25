import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";
import {
  Loader2,
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";

import { getAnalytics } from "../../services/adminService";
import AnimatedNumber from "../../components/ui/AnimatedNumber";
import Logo from "@/components/common/Logo";
import { BRAND } from "@/constants/brand";
import { scmsLogo } from "@/assets/logos";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState("month");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [downloadingPngs, setDownloadingPngs] = useState({});
  const [chartWidth, setChartWidth] = useState(500);

  // Chart refs for PDF capture
  const statusChartRef = useRef(null);
  const priorityChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const trendChartRef = useRef(null);

  // Custom date range states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const autoRefreshTimer = useRef(null);
  const logoBase64Ref = useRef(null);

  useEffect(() => {
    // Pre-convert PNG logo to Base64 for PDF generation caching
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        logoBase64Ref.current = canvas.toDataURL("image/png");
        console.log("[PDF] Logo converted and cached successfully.");
      } catch (err) {
        console.error("[PDF] Base64 conversion failed:", err);
      }
    };
    img.onerror = (e) => {
      console.error("[PDF] Failed to load logo for cache:", e);
    };
    img.src = scmsLogo;
  }, []);

  // Measure chart widths dynamically to support html-to-image/html2canvas DOM cloning
  useEffect(() => {
    const handleResize = () => {
      if (statusChartRef.current) {
        const cardWidth = statusChartRef.current.getBoundingClientRect().width;
        const contentWidth = Math.max(280, cardWidth - 48); // subtract card padding (p-6 = 48px)
        setChartWidth(contentWidth);
      }
    };

    const timer = setTimeout(handleResize, 150);

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [analytics, loading]);

  const fetchAnalyticsData = async (
    selectedRange,
    customStart = "",
    customEnd = "",
    silent = false,
  ) => {
    try {
      if (!silent) {
        if (analytics) setRefreshing(true);
        else setLoading(true);
      }

      const params = {};
      if (selectedRange === "custom") {
        if (customStart) params.startDate = customStart;
        if (customEnd) params.endDate = customEnd;
      } else {
        params.range = selectedRange;
      }

      const res = await getAnalytics(params);
      setAnalytics(res.analytics);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Main fetch hook: runs on range change, or start/end date changes
  useEffect(() => {
    fetchAnalyticsData(range, startDate, endDate);
  }, [range, startDate, endDate]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    autoRefreshTimer.current = setInterval(() => {
      fetchAnalyticsData(range, startDate, endDate, true);
    }, 60000);

    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, [range, startDate, endDate]);

  const handleManualRefresh = () => {
    fetchAnalyticsData(range, startDate, endDate);
    toast.success("Analytics data updated!");
  };

  // Convert SVG chart to PNG and download
  const downloadChartAsPng = async (chartRef, filename, chartKey) => {
    if (!chartRef || !chartRef.current) {
      toast.error("Chart reference not available.");
      return;
    }

    setDownloadingPngs((prev) => ({ ...prev, [chartKey]: true }));
    const toastId = toast.loading(`Downloading ${filename.replace(/_/g, " ")}...`);

    try {
      const filter = (node) => {
        if (node.classList?.contains("export-exclude")) {
          return false;
        }
        return true;
      };

      const dataUrl = await toPng(chartRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: filter,
        style: {
          transform: "scale(1)",
        },
      });

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `${filename}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast.success("Download successful!", { id: toastId });
    } catch (err) {
      console.error(`Failed to download chart ${filename}:`, err);
      toast.error("Failed to download chart image.", { id: toastId });
    } finally {
      setDownloadingPngs((prev) => ({ ...prev, [chartKey]: false }));
    }
  };

  const getFinalY = (doc, fallbackY = 50) => {
    return doc.lastAutoTable && typeof doc.lastAutoTable.finalY === "number"
      ? doc.lastAutoTable.finalY
      : fallbackY;
  };

  const captureChartForPdf = async (chartRef) => {
    if (!chartRef || !chartRef.current) {
      console.warn("Chart ref is empty or unattached");
      return null;
    }

    const element = chartRef.current;
    
    // Verify valid width and height before capturing
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      console.warn("Chart element has invalid dimensions:", rect.width, rect.height);
      return null;
    }

    try {
      const filter = (node) => {
        if (node.classList?.contains("export-exclude")) {
          return false;
        }
        return true;
      };

      const dataUrl = await toPng(element, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: filter,
        style: {
          transform: "scale(1)",
        },
      });

      return dataUrl;
    } catch (error) {
      console.error("Failed to capture chart for PDF:", error);
      return null;
    }
  };

  // Helper functions for modular PDF layout configuration
  const drawHeader = (doc, rangeLabel, formattedDate, formattedTime, logoPng) => {
    // SCMS Logo rendering
    if (logoPng) {
      doc.addImage(logoPng, "PNG", 14, 12, 32.5, 32.5, undefined, "FAST");
    }

    // Report Title next to the logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("Executive Analytics Report", 52, 24);

    // Generated Timestamp
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Generated: ${formattedDate}, ${formattedTime}`, 52, 31);
    doc.text(`Range: ${rangeLabel} | Generated By: Administrator`, 52, 37);

    // Single clean horizontal divider below header
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, 50, 196, 50);
  };

  const drawKpiCards = (doc, yStart) => {
    const cardWidth = 41;
    const cardHeight = 18;
    const gap = 6;
    const xStart = 14;

    const cards = [
      { label: "Total Complaints", value: analytics.totalComplaints, color: [37, 99, 235] },
      { label: "Pending", value: analytics.pending, color: [245, 158, 11] },
      { label: "Resolved", value: analytics.resolved, color: [16, 185, 129] },
      { label: "Resolution Rate", value: `${analytics.resolutionRate}%`, color: [79, 70, 229] }
    ];

    cards.forEach((card, index) => {
      const x = xStart + index * (cardWidth + gap);

      // Card Background
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, yStart, cardWidth, cardHeight, 1.5, 1.5, "FD");

      // Accent Left Line
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.rect(x, yStart, 1.2, cardHeight, "F");

      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, x + 3.5, yStart + 5);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(String(card.value), x + 3.5, yStart + 13);
    });

    return yStart + cardHeight + 4;
  };

  const generateInsights = () => {
    const total = analytics.totalComplaints || 0;
    const pending = analytics.pending || 0;
    const rate = analytics.resolutionRate || 0;
    const high = analytics.highPriority || 0;

    const insightsList = [];
    insightsList.push(`Total complaints logged during this period: ${total}.`);
    if (total > 0) {
      const pendingPercent = ((pending / total) * 100).toFixed(1);
      insightsList.push(`${pendingPercent}% of complaints are currently pending resolution.`);
    }
    insightsList.push(`The average complaint resolution rate stands at ${rate}%.`);
    if (high > 0) {
      insightsList.push(`${high} complaints are flagged as High Priority and require immediate administrative attention.`);
    } else {
      insightsList.push("There are currently no outstanding high-priority complaints requiring urgent escalation.");
    }
    if (analytics.categoryWise && analytics.categoryWise.length > 0) {
      const catSummary = analytics.categoryWise
        .slice(0, 3)
        .map((c) => `${c._id || "Other"} (${c.count})`)
        .join(", ");
      insightsList.push(`Primary sources of complaints include: ${catSummary}.`);
    }
    return insightsList;
  };

  const drawInsights = (doc, yStart) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Executive Insights", 14, yStart + 6);

    const list = generateInsights();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    let y = yStart + 11;
    list.forEach((insight) => {
      // Draw bullet
      doc.setFillColor(37, 99, 235);
      doc.circle(16, y - 1, 0.7, "F");

      const textLines = doc.splitTextToSize(insight, 172);
      doc.text(textLines, 20, y + 1);
      y += (textLines.length * 4) + 1.5;
    });

    return y + 2;
  };

  const drawCharts = (doc, statusImg, priorityImg, categoryImg, trendImg) => {
    const drawChartCard = (img, x, y, width, height, title, statsSummary) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      const cardHeight = height + 22; 
      doc.roundedRect(x - 2, y - 6, width + 4, cardHeight, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(title, x, y - 1.5);

      if (img) {
        doc.addImage(img, "PNG", x, y, width, height, undefined, "FAST");
      } else {
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, width, height, 2, 2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("Chart unavailable", x + width / 2, y + height / 2, { align: "center" });
      }

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(x, y + height + 1, x + width, y + height + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(statsSummary, x + 2, y + height + 5);
    };

    const topCategories = (analytics.categoryWise || [])
      .slice(0, 3)
      .map(c => `${c._id || "Other"}: ${c.count}`)
      .join("  |  ");

    const monthsCount = analytics.monthlyTrend?.length || 1;
    const avgVolume = (analytics.totalComplaints / monthsCount).toFixed(1);

    drawChartCard(
      statusImg, 16, 32, 84, 56, 
      "Complaint Status Distribution", 
      `Pending: ${analytics.pending}  |  Resolved: ${analytics.resolved}  |  In Progress: ${analytics.inProgress}`
    );
    drawChartCard(
      priorityImg, 110, 32, 84, 56, 
      "Priority Distribution Breakdown", 
      `High: ${analytics.highPriority}  |  Medium: ${analytics.mediumPriority}  |  Low: ${analytics.lowPriority}`
    );
    drawChartCard(
      categoryImg, 16, 118, 84, 56, 
      "Category Wise Volume Distribution", 
      topCategories || "No Category Data"
    );
    drawChartCard(
      trendImg, 110, 118, 84, 56, 
      "Monthly Log Volume Trend Analysis", 
      `Total Monitored Months: ${monthsCount}  |  Average: ${avgVolume} complaints/month`
    );
  };

  const drawFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, 276, 196, 276);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      doc.text(BRAND.appName, 14, 281);
      doc.text("Enterprise Analytics Report", 14, 285);

      doc.text("Generated automatically by Admin Dashboard", 75, 281);
      doc.setFont("helvetica", "bold");
      doc.text("Confidential Report", 75, 285);

      doc.setFont("helvetica", "normal");
      doc.text(`Page ${i} of ${pageCount}`, 180, 283);
    }
  };

  // Export PDF Audit Report
  const exportPDFReport = async () => {
    if (!analytics) return;
    if (exportingPdf) return;

    setExportingPdf(true);
    const toastId = toast.loading("Generating PDF...");

    try {
      const doc = new jsPDF("p", "mm", "a4");

      // --- DATE & TIME FORMATTERS ---
      const currentDate = new Date();
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const day = currentDate.getDate();
      const monthName = months[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      const formattedDate = `${day} ${monthName} ${year}`; // e.g. "22 July 2026"

      let hours = currentDate.getHours();
      let minutes = currentDate.getMinutes();
      const actualAmPm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const formattedTime = `${formattedHours}:${formattedMinutes} ${actualAmPm}`; // e.g. "07:32 AM"

      const getRangeLabel = (r) => {
        const labels = {
          today: "Today",
          week: "This Week",
          month: "This Month",
          year: "This Year",
          custom: "Custom Range",
        };
        return labels[r.toLowerCase()] || r;
      };
      const rangeLabel = getRangeLabel(range);

      // Render Header Layout (using pre-cached base64 logo image)
      drawHeader(doc, rangeLabel, formattedDate, formattedTime, logoBase64Ref.current);

      // Render KPI cards row
      const insightsStartY = drawKpiCards(doc, 71);

      // Render insights list
      const breakdownStartY = drawInsights(doc, insightsStartY);

      // Render Detailed Breakdown Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("2. Detailed Operational Analytics Breakdown", 14, breakdownStartY + 4);

      const tablesStartY = breakdownStartY + 9;

      const kpiTableHeaders = ["Metric Indicator", "Current Value", "Operational Status"];
      const kpiTableBody = [
        ["Total Logged Complaints", analytics.totalComplaints, "Log Volume Overview"],
        ["Pending Status Complaints", analytics.pending, "Action Required"],
        ["In Progress Status Complaints", analytics.inProgress, "Active Investigation"],
        ["Resolved Status Complaints", analytics.resolved, `${analytics.resolutionRate}% Success Rate`],
        ["High Priority Flagged Issues", analytics.highPriority, "Critical Priority Action"],
        ["Resolution Success Rate", `${analytics.resolutionRate}%`, "KPI Target Metrics"],
      ];

      autoTable(doc, {
        startY: tablesStartY,
        head: [kpiTableHeaders],
        body: kpiTableBody,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235], fontStyle: "bold", fontSize: 9.5 },
        styles: { fontSize: 8.5, cellPadding: 4, textColor: [51, 65, 85] },
        columnStyles: {
          1: { fontStyle: "bold", textColor: [37, 99, 235] },
          2: { textColor: [255, 255, 255] } // we will make text white to overlay on colored badges
        },
        didDrawCell: (data) => {
          if (data.column.index === 2 && data.cell.section === "body") {
            const val = data.cell.raw;
            let bgColor = [148, 163, 184]; // default gray
            
            if (val.includes("Success") || val.includes("Target")) {
              bgColor = [16, 185, 129]; // Emerald Green
            } else if (val.includes("Required") || val.includes("Critical") || val.includes("Action")) {
              bgColor = [239, 68, 68]; // Red
            } else if (val.includes("Active") || val.includes("Log") || val.includes("Overview")) {
              bgColor = [245, 158, 11]; // Yellow/Amber
            }

            // Draw rounded badge rectangle over the cell background
            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.setDrawColor(bgColor[0], bgColor[1], bgColor[2]);
            const x = data.cell.x + 2;
            const y = data.cell.y + 1.5;
            const w = data.cell.width - 4;
            const h = data.cell.height - 3;
            doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");

            // Draw white centered text
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(255, 255, 255);
            doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, {
              align: "center",
              baseline: "middle"
            });
          }
        }
      });

      const nextTableY = getFinalY(doc, tablesStartY + 50);

      // Category Wise Table (Left Column)
      const categoryRows = (analytics.categoryWise || []).map((c) => [c._id || "Other", c.count]);
      autoTable(doc, {
        startY: nextTableY + 8,
        head: [["Category Area", "Total Complaints"]],
        body: categoryRows,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 3, textColor: [71, 85, 105] },
        margin: { right: 110 },
      });
      const categoryFinalY = getFinalY(doc, nextTableY + 8 + categoryRows.length * 7 + 10);

      // Priority Distribution Table (Right Column)
      const priorityRows = [
        ["High", analytics.highPriority],
        ["Medium", analytics.mediumPriority],
        ["Low", analytics.lowPriority],
      ];
      autoTable(doc, {
        startY: nextTableY + 8,
        head: [["Priority Level", "Count"]],
        body: priorityRows,
        theme: "striped",
        headStyles: { fillColor: [245, 158, 11], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 3, textColor: [71, 85, 105] },
        margin: { left: 110 },
      });
      const priorityFinalY = getFinalY(doc, nextTableY + 8 + priorityRows.length * 7 + 10);

      // Monthly Trend Table
      const monthlyRows = (analytics.monthlyTrend || []).map((m) => [
        `${m._id.month}/${m._id.year}`,
        m.count,
      ]);
      autoTable(doc, {
        startY: Math.max(categoryFinalY, priorityFinalY) + 8,
        head: [["Month Trend", "Complaints Volume"]],
        body: monthlyRows,
        theme: "striped",
        headStyles: { fillColor: [14, 165, 233], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 3, textColor: [71, 85, 105] },
      });

      // --- PAGE 2: CHARTS VISUALIZATION ---
      doc.addPage();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("3. High-Resolution Dashboard Graphical Visualizations", 14, 20);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 24, 196, 24);

      // High-resolution image capture of each chart using html-to-image
      const [statusImg, priorityImg, categoryImg, trendImg] = await Promise.all([
        captureChartForPdf(statusChartRef),
        captureChartForPdf(priorityChartRef),
        captureChartForPdf(categoryChartRef),
        captureChartForPdf(trendChartRef),
      ]);

      // Draw standard dashboard charts layout
      drawCharts(doc, statusImg, priorityImg, categoryImg, trendImg);

      // Draw footer on every single page
      drawFooter(doc);

      // Convert timestamp for filename matching
      const localFileDate = currentDate.toISOString().split("T")[0];
      const localFileTime = currentDate.toTimeString().split(" ")[0].replace(/:/g, "-").slice(0, 5);
      
      doc.save(`Analytics_Report_${localFileDate}_${localFileTime}.pdf`);
      toast.success("PDF Generated Successfully", { id: toastId });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error(`Failed to Generate PDF: ${err.message || err}`, { id: toastId });
    } finally {
      setExportingPdf(false);
    }
  };

  // Export Excel Statistics
  const exportExcelReport = () => {
    if (!analytics) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: General summary KPIs
      const overviewSummary = [
        {
          "Metric Description": "Total Complaints Vol",
          "Report Value": analytics.totalComplaints,
        },
        {
          "Metric Description": "Pending Complaints",
          "Report Value": analytics.pending,
        },
        {
          "Metric Description": "In Progress",
          "Report Value": analytics.inProgress,
        },
        {
          "Metric Description": "Resolved",
          "Report Value": analytics.resolved,
        },
        {
          "Metric Description": "High Priority Issues",
          "Report Value": analytics.highPriority,
        },
        {
          "Metric Description": "Medium Priority Issues",
          "Report Value": analytics.mediumPriority,
        },
        {
          "Metric Description": "Low Priority Issues",
          "Report Value": analytics.lowPriority,
        },
        {
          "Metric Description": "Resolution Percentage (%)",
          "Report Value": analytics.resolutionRate,
        },
      ];
      const wsOverview = XLSX.utils.json_to_sheet(overviewSummary);
      XLSX.utils.book_append_sheet(wb, wsOverview, "General Overview Stats");

      // Sheet 2: Category volume distribution
      const categoryData = (analytics.categoryWise || []).map((c) => ({
        "Complaint Category Area": c._id || "Other",
        "Volume Count": c.count,
      }));
      const wsCategory = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, wsCategory, "Category Breakdown");

      // Sheet 3: Monthly Trend analysis
      const monthlyData = (analytics.monthlyTrend || []).map((m) => ({
        "Calendar Month": `${m._id.month}/${m._id.year}`,
        "Complaints Count": m.count,
      }));
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Trend Log");

      // Write save
      XLSX.writeFile(
        wb,
        `Complaint_Analytics_Data_${range}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success("Excel spreadsheet exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel file.");
    }
  };

  // Stat Card click route handlers
  const handleStatCardClick = (filterKey, filterValue) => {
    if (filterKey === "all") {
      navigate("/admin/complaints");
    } else {
      navigate(
        `/admin/complaints?${filterKey}=${encodeURIComponent(filterValue)}`,
      );
    }
  };

  // High fidelity Skeleton Loading view
  if (loading && !analytics) {
    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-10 w-44 bg-slate-200 rounded-xl"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[400px] bg-slate-100 border border-slate-200 rounded-2xl p-5 space-y-4"
            >
              <div className="h-6 w-44 bg-slate-200 rounded"></div>
              <div className="h-72 bg-slate-200/50 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Format Recharts data structures
  const statusData = [
    { name: "Pending", value: analytics.pending },
    { name: "In Progress", value: analytics.inProgress },
    { name: "Resolved", value: analytics.resolved },
  ];

  const priorityData = [
    { name: "High", value: analytics.highPriority },
    { name: "Medium", value: analytics.mediumPriority },
    { name: "Low", value: analytics.lowPriority },
  ];

  const categoryData = (analytics.categoryWise || []).map((item) => ({
    name: item._id || "Other",
    value: item.count,
  }));

  const monthlyData = (analytics.monthlyTrend || []).map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    complaints: item.count,
  }));

  // Evaluation criteria for empty state: no complaints logged in filter range
  const hasNoData = analytics.totalComplaints === 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-12">
      {/* Sticky Top Filter Panel */}
      <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Logo iconOnly size="h-9" />
            Analytics Overview
            {refreshing && (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            MERN Enterprise Audit & Complaint Metrics System
          </p>
        </div>

        {/* Filter Controls block */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Dropdown Preset */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-sm hover:border-blue-500 transition-colors">
            <Calendar className="w-4 h-4 text-blue-600" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {range === "custom" && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-sm animate-in slide-in-from-left duration-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
                placeholder="Start Date"
              />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
                placeholder="End Date"
              />
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold px-3 py-2 rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${refreshing ? "animate-spin text-blue-600" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {/* Export Suite */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportPDFReport}
              disabled={exportingPdf}
              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 font-semibold px-3.5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export Summary & Details as PDF"
            >
              {exportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-700" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{exportingPdf ? "Generating..." : "Export PDF"}</span>
            </button>
            <button
              onClick={exportExcelReport}
              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 font-semibold px-3.5 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm"
              title="Export Spreadsheets raw data to Excel Workbook"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Complaints"
          value={<AnimatedNumber value={analytics.totalComplaints} />}
          subtext={`+${analytics.thisMonthCount || 0} logged this month`}
          icon={<ClipboardList size={22} />}
          color="bg-blue-600"
          onClick={() => handleStatCardClick("all")}
        />

        <StatCard
          title="Pending"
          value={<AnimatedNumber value={analytics.pending} />}
          subtext="Needs attention"
          icon={<Clock3 size={22} />}
          color="bg-amber-500"
          onClick={() => handleStatCardClick("status", "Pending")}
        />

        <StatCard
          title="In Progress"
          value={<AnimatedNumber value={analytics.inProgress} />}
          subtext="Active investigation"
          icon={<TrendingUp size={22} />}
          color="bg-purple-600"
          onClick={() => handleStatCardClick("status", "In Progress")}
        />

        <StatCard
          title="Resolved"
          value={<AnimatedNumber value={analytics.resolved} />}
          subtext={`${analytics.resolutionRate}% Success Rate`}
          icon={<CheckCircle2 size={22} />}
          color="bg-emerald-600"
          onClick={() => handleStatCardClick("status", "Resolved")}
        />

        <StatCard
          title="High Priority"
          value={<AnimatedNumber value={analytics.highPriority} />}
          subtext="Critical incidents"
          icon={<AlertTriangle size={22} />}
          color="bg-red-600"
          onClick={() => handleStatCardClick("priority", "High")}
        />

        <StatCard
          title="Resolution Rate"
          value={<AnimatedNumber value={`${analytics.resolutionRate}%`} />}
          subtext={
            parseFloat(analytics.resolutionRate) >= 80
              ? "Excellent Performance"
              : "Requires Evaluation"
          }
          icon={<CheckCircle2 size={22} />}
          color="bg-indigo-600"
          onClick={() => handleStatCardClick("all")}
        />
      </div>

      {/* Empty State overlay logic vs Charts visualization */}
      {hasNoData ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4 shadow-sm flex flex-col justify-center items-center">
          <div className="bg-slate-100 p-6 rounded-full text-slate-400">
            <HelpCircle className="w-16 h-16 animate-bounce" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">
            No complaints found for this period
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Try expanding your date filter parameters or modifying date
            selectors. There are no complaints recorded in the database match
            your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Complaint Status Doughnut */}
          <ChartCard
            title="Complaint Status"
            chartId="status-doughnut"
            innerRef={statusChartRef}
            downloading={downloadingPngs["status"]}
            onDownload={() =>
              downloadChartAsPng(statusChartRef, "Status_Distribution", "status")
            }
          >
            <div className="w-full flex justify-center items-center h-[300px]">
              <PieChart width={chartWidth} height={300}>
                <Pie
                  data={statusData}
                  dataKey="value"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={5}
                  label
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "10px" }}
                />
              </PieChart>
            </div>
          </ChartCard>

          {/* Priority Distribution Doughnut */}
          <ChartCard
            title="Priority Distribution"
            chartId="priority-doughnut"
            innerRef={priorityChartRef}
            downloading={downloadingPngs["priority"]}
            onDownload={() =>
              downloadChartAsPng(priorityChartRef, "Priority_Distribution", "priority")
            }
          >
            <div className="w-full flex justify-center items-center h-[300px]">
              <PieChart width={chartWidth} height={300}>
                <Pie
                  data={priorityData}
                  dataKey="value"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={5}
                  label
                >
                  {priorityData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "10px" }}
                />
              </PieChart>
            </div>
          </ChartCard>

          {/* Category Wise Bar Chart */}
          <ChartCard
            title="Category Wise Distribution"
            chartId="category-bar"
            innerRef={categoryChartRef}
            downloading={downloadingPngs["category"]}
            onDownload={() =>
              downloadChartAsPng(categoryChartRef, "Category_Distribution", "category")
            }
          >
            <div className="w-full flex justify-center items-center h-[300px]">
              <BarChart width={chartWidth} height={300} data={categoryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </div>
          </ChartCard>

          {/* Monthly Trend Area Chart */}
          <ChartCard
            title="Monthly Trend Analysis"
            chartId="trend-area"
            innerRef={trendChartRef}
            downloading={downloadingPngs["trend"]}
            onDownload={() =>
              downloadChartAsPng(trendChartRef, "Monthly_Trend", "trend")
            }
          >
            <div className="w-full flex justify-center items-center h-[300px]">
              <AreaChart width={chartWidth} height={300} data={monthlyData}>
                <defs>
                  <linearGradient
                    id="colorComplaints"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  dataKey="month"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="complaints"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorComplaints)"
                />
              </AreaChart>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, subtext, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between p-5 relative cursor-pointer group"
  >
    <div className="flex justify-between items-start w-full">
      <div>
        <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-wider">
          {title}
        </p>
        <h2 className="text-3xl font-extrabold text-slate-800 mt-2 tracking-tight">
          {value}
        </h2>
      </div>
      <div
        className={`p-3 rounded-2xl ${color} text-white shadow-sm transition-transform duration-300 group-hover:scale-110`}
      >
        {icon}
      </div>
    </div>
    <div className="mt-4 flex items-center gap-1.5">
      <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
        {subtext}
      </span>
    </div>
  </button>
);

const ChartCard = ({ title, children, onDownload, chartId, innerRef, downloading }) => (
  <div
    ref={innerRef}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between relative group hover:shadow-md transition-shadow duration-300"
    id={chartId}
  >
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-base font-bold text-slate-800 tracking-tight">
        {title}
      </h2>
      <button
        onClick={onDownload}
        disabled={downloading}
        className="export-exclude opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 transition-opacity bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
        title="Download Chart as PNG"
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{downloading ? "Saving..." : "PNG"}</span>
      </button>
    </div>
    <div className="w-full flex-1">{children}</div>
  </div>
);

export default AdminAnalytics;
