import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type EmailLayoutProps = {
  preview: string;
  restaurantName: string;
  children: React.ReactNode;
};

export function EmailLayout({
  preview,
  restaurantName,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang="sv">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>{restaurantName}</Heading>
          </Section>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            {restaurantName} · Detta meddelande skickades automatiskt.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "24px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const header = {
  marginBottom: "24px",
};

const brand = {
  color: "#b85c38",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0",
};

const hr = {
  borderColor: "#e4e4e7",
  margin: "24px 0",
};

const footer = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0",
};

export const card = {
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

export const label = {
  color: "#71717a",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

export const value = {
  color: "#18181b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
};

export const paragraph = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export const itemRow = {
  color: "#18181b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 6px",
};

export const total = {
  color: "#b85c38",
  fontSize: "18px",
  fontWeight: "700",
  margin: "12px 0 0",
};
