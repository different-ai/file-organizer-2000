'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Wallet, CheckCircle2 } from "lucide-react";

export function ValueJourney() {
  return (
    <Card className="border-border/40 bg-background/60 backdrop-blur-sm">
      <CardHeader>
        <CardDescription>See how HyprSqrl automates your financial operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/40 bg-background/60">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Eye className="mr-2 h-4 w-4 text-[#6E45FE]" />
                1. Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI monitors your screen, emails, and messages for financial activities and opportunities.
              </p>
              <div className="mt-4 p-2 bg-muted/40 rounded-md">
                <p className="text-sm italic">
                  "Detected: Payment agreement of $2,500 for UI mockups in design review meeting"
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-background/60">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Wallet className="mr-2 h-4 w-4 text-[#6E45FE]" />
                2. Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                HyprSqrl automatically processes financial tasks and optimizes treasury positions.
              </p>
              <div className="mt-4 space-y-2">
                <Badge variant="secondary" className="bg-[#6E45FE]/10 text-[#6E45FE] hover:bg-[#6E45FE]/20">
                  Payment Triggered
                </Badge>
                <p className="text-sm">USDC transfer prepared: $2,500</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-background/60">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CheckCircle2 className="mr-2 h-4 w-4 text-[#6E45FE]" />
                3. Optimize
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review automated actions and optimize treasury yields with one click.
              </p>
              <div className="mt-4 p-2 bg-muted/40 rounded-md">
                <p className="text-sm">
                  🚀 Yield Opportunity: Move $50k USDC from Aave (8.2% APY) to Compound (12.5% APY) for +$2,150/year
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
} 