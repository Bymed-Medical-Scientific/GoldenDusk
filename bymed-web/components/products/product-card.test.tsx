import { ProductCard, type ProductCardProduct } from "@/components/products/product-card";
import { render, screen } from "@testing-library/react";

jest.mock("../price/formatted-price", () => ({
  FormattedPrice: ({
    amount,
    currency = "USD",
  }: {
    amount: number;
    currency?: string;
  }) => {
    const code = String(currency).trim().toUpperCase();
    let text: string;
    try {
      text = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      text = `${Number(amount).toFixed(2)} ${code}`;
    }
    return <span data-testid="product-card-price">{text}</span>;
  },
}));

function renderCard(product: ProductCardProduct) {
  return render(<ProductCard product={product} />);
}

function expectedCatalogPrice(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

describe("ProductCard", () => {
  const base: ProductCardProduct = {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    name: "Benchtop Centrifuge",
    imageUrl: "https://cdn.example.com/products/centrifuge.jpg",
    imageAlt: "Centrifuge on bench",
    price: 1249.5,
    currency: "USD",
    isAvailable: true,
    inventoryCount: 3,
    categoryName: "Laboratory equipment",
  };

  it("renders required information: category, name, image, price, and product links", () => {
    renderCard(base);

    expect(screen.getByText("Laboratory equipment")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Benchtop Centrifuge" }),
    ).toBeInTheDocument();

    const img = screen.getByRole("img", { name: "Centrifuge on bench" });
    expect(img).toHaveAttribute("src");
    expect(img.getAttribute("src")).toContain(
      encodeURIComponent("https://cdn.example.com/products/centrifuge.jpg"),
    );

    expect(screen.getByTestId("product-card-price")).toHaveTextContent(
      expectedCatalogPrice(1249.5, "USD"),
    );

    expect(
      screen.getByRole("link", { name: "Benchtop Centrifuge" }),
    ).toHaveAttribute("href", `/products/${base.id}`);
    expect(
      screen.getByRole("link", { name: "Centrifuge on bench" }),
    ).toHaveAttribute("href", `/products/${base.id}`);
  });

  it("shows placeholder when there is no image URL", () => {
    renderCard({ ...base, imageUrl: undefined });
    expect(
      screen.getByRole("img", { name: "No image" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Centrifuge on bench" }),
    ).not.toBeInTheDocument();
  });

  it("shows out of stock when isAvailable is false", () => {
    renderCard({ ...base, isAvailable: false, inventoryCount: 2 });
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("shows out of stock when inventoryCount is zero", () => {
    renderCard({ ...base, isAvailable: true, inventoryCount: 0 });
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("does not show out of stock when in stock", () => {
    renderCard(base);
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
  });

  it("formats price using the product catalog currency", () => {
    const { rerender } = renderCard({ ...base, price: 88, currency: "usd" });
    expect(screen.getByTestId("product-card-price")).toHaveTextContent(
      expectedCatalogPrice(88, "USD"),
    );

    rerender(
      <ProductCard
        product={{
          ...base,
          price: 42.25,
          currency: "EUR",
        }}
      />,
    );
    expect(screen.getByTestId("product-card-price")).toHaveTextContent(
      expectedCatalogPrice(42.25, "EUR"),
    );
  });
});
