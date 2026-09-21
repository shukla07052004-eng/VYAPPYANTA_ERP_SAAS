import connectDB from "@/lib/dbconnect";
import { NextRequest, NextResponse } from "next/server";
import { Item } from "@/models/ItemModel";

const CATEGORY_TO_MONGO: Record<string, string> = {
  "Other Goods": "OtherGoods",
  Infusion: "infusion",
};

type MongoItemPayload = ReturnType<typeof toMongoItem>;

function dateKey(value: unknown): string {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toISOString().slice(0, 10);
}

function gstKey(gst: unknown): string {
  if (Array.isArray(gst)) {
    return gst.map((entry) => Number(entry)).sort((a, b) => a - b).join(",");
  }
  return String(Number(gst));
}

function itemSignature(data: MongoItemPayload): string {
  return JSON.stringify({
    name: String(data.name).trim().toLowerCase(),
    batchNo: String(data.batchNo).trim().toUpperCase(),
    category: data.category,
    mfgDate: dateKey(data.mfgDate),
    expiryDate: dateKey(data.expiryDate),
    Barcode: String(data.Barcode ?? "").trim(),
    expiryAlert: Boolean(data.expiryAlert),
    purchasePrice: Number(data.purchasePrice),
    salesPrice: Number(data.salesPrice),
    mrp: Number(data.mrp),
    stockQty: Number(data.stockQty),
    discount: Number(data.discount ?? 0),
    gst: gstKey(data.gst),
    notesTag: String(data.notesTag ?? "").trim().toUpperCase(),
    notes: String(data.notes ?? "").trim(),
  });
}

function comparableFromDocument(doc: Record<string, unknown>): MongoItemPayload {
  const gstSlab = Number(
    Array.isArray(doc.gst) ? doc.gst[0] : doc.gst ?? 0
  );

  return {
    name: String(doc.name ?? "").trim().toLowerCase(),
    batchNo: String(doc.batchNo ?? ""),
    category: String(doc.category ?? "Tablet"),
    mfgDate: doc.mfgDate,
    expiryDate: doc.expiryDate,
    Barcode: doc.Barcode ?? doc.barcode ?? "",
    expiryAlert: doc.expiryAlert !== false,
    purchasePrice: Number(doc.purchasePrice ?? 0),
    salesPrice: Number(doc.salesPrice ?? 0),
    mrp: Number(doc.mrp ?? 0),
    stockQty: Number(doc.stockQty ?? 0),
    discount: Number(doc.discount ?? 0),
    gst: Array.isArray(doc.gst) ? doc.gst : [gstSlab],
    notesTag: doc.notesTag,
    notes: doc.notes,
  };
}

async function findDuplicateItem(
  mongo: MongoItemPayload,
  excludeId?: string
) {
  const query: Record<string, unknown> = {
    name: String(mongo.name).trim().toLowerCase(),
    batchNo: mongo.batchNo,
    category: mongo.category,
    purchasePrice: mongo.purchasePrice,
    salesPrice: mongo.salesPrice,
    mrp: mongo.mrp,
    stockQty: mongo.stockQty,
    discount: mongo.discount ?? 0,
    Barcode: mongo.Barcode ?? "",
    expiryAlert: mongo.expiryAlert,
    notesTag: mongo.notesTag ?? "",
    notes: mongo.notes ?? "",
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const candidates = await Item.find(query);
  const targetSignature = itemSignature(mongo);

  return (
    candidates.find(
      (doc) =>
        itemSignature(
          comparableFromDocument(doc.toObject() as Record<string, unknown>)
        ) === targetSignature
    ) ?? null
  );
}

function toMongoItem(body: Record<string, unknown>) {
  const rawCategory = String(body.category ?? "Tablet");
  const category =
    CATEGORY_TO_MONGO[rawCategory] ?? rawCategory;

  const gstSlab = Number(body.gstSlab ?? body.gst ?? 0);

  return {
    name: String(body.name ?? "").trim().toLowerCase(),
    batchNo: body.batchNo,
    category,
    mfgDate: body.mfgDate,
    expiryDate: body.expiryDate,
    Barcode: body.barcode ?? body.Barcode ?? "",
    expiryAlert: body.expiryAlert !== false,
    purchasePrice: Number(body.purchasePrice ?? 0),
    salesPrice: Number(body.salesPrice ?? 0),
    mrp: Number(body.mrp ?? 0),
    stockQty: Number(body.stockQty ?? 0),
    discount: Number(body.discount ?? 0),
    gst: Array.isArray(body.gst) ? body.gst : [gstSlab],
    notesTag: body.notesTag,
    notes: body.notes,
  };
}

export async function POST(req: NextRequest) {
  console.log("🔥 ITEM CONTENT ROUTE HIT");

  try {
    await connectDB();

    const data = await req.json();

    console.log("ITEM DATA RECEIVED:", data);

    const mongoPayload = toMongoItem(data);
    const duplicate = await findDuplicateItem(mongoPayload);

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An item with the same details already exists. Update or delete the existing item instead.",
        },
        { status: 409 }
      );
    }

    const item = await Item.create(mongoPayload);

    return NextResponse.json(
      {
        success: true,
        message: "Item created successfully",
        data: item,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("❌ ITEM API ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create item";

    return NextResponse.json(
      {
        success: false,
        message,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const items = await Item.find().sort({ _id: -1 });

    return NextResponse.json(
      {
        success: true,
        message: "Items fetched successfully",
        data: items,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ GET ITEMS ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch items";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Item ID is required",
        },
        { status: 400 }
      );
    }

    const mongoPayload = toMongoItem(rest);
    const duplicate = await findDuplicateItem(mongoPayload, String(id));

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another item already has these exact details. Change the fields or edit that item instead.",
        },
        { status: 409 }
      );
    }

    const item = await Item.findByIdAndUpdate(id, mongoPayload, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "Item not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Item updated successfully",
        data: item,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ UPDATE ITEM ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update item";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Item ID is required",
        },
        { status: 400 }
      );
    }

    const item = await Item.findByIdAndDelete(id);

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          message: "Item not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Item deleted successfully",
        data: item,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ DELETE ITEM ERROR:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete item";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
