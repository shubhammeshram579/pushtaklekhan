"use client";
import { useParams } from "next/navigation";
import BookEditor from "../../../components/book/BookEditor";

export default function BookPage() {
  const { bookId } = useParams();
  return <BookEditor bookId={bookId} />;
}

