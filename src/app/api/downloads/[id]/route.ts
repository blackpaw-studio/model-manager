import { NextResponse } from "next/server";
import { getJobManager } from "@/lib/download/job-manager";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobManager = getJobManager();
  const job = jobManager.getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobManager = getJobManager();

  const job = await jobManager.retryJob(id);

  if (!job) {
    const existingJob = jobManager.getJob(id);
    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (existingJob.status === "downloading" || existingJob.status === "pending") {
      return NextResponse.json(
        { error: "Download is already in progress" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Cannot retry this job" },
      { status: 400 }
    );
  }

  return NextResponse.json({ job, message: "Download restarted" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobManager = getJobManager();
  const cancelled = jobManager.cancelJob(id);

  if (cancelled) {
    return NextResponse.json({ success: true, message: "Download cancelled" });
  }

  const job = jobManager.getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: false,
    message: "Download is not active",
    status: job.status,
  });
}
