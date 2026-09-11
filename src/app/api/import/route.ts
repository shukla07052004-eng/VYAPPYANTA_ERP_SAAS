import { NextRequest, NextResponse } from "next/server";
import { processImportFile } from "@/ImportModules/core/processFile";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No file uploaded",
                },
                { status: 400 }
            );
        }

        const result = await processImportFile(file, {
            fileName: file.name,
            importKind: "complete",
        });

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? "File processed successfully"
                : "File processing failed",
            data: result,
        });

    } catch (error) {
        console.error("Import error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong while importing the file",
            },
            { status: 500 }
        );
    }
}