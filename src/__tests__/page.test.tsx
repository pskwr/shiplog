import { render, screen } from "@testing-library/react";
import HomePage from "../app/page";

describe("HomePage", () => {
  it("should render the hello world heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello World");
  });

  it("should render the status paragraph", () => {
    render(<HomePage />);
    expect(screen.getByText("The app is running.")).toBeInTheDocument();
  });
});
