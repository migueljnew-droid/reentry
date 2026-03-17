import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  return NextResponse.json({
    userId,
    matches: [
      { id: randomUUID(), employer: 'Amazon Warehouse', title: 'Warehouse Associate', location: 'Atlanta, GA', salary: '$17-22/hr', convictionFriendly: true, matchScore: 0.85 },
      { id: randomUUID(), employer: 'Goodwill Industries', title: 'Retail Associate', location: 'Atlanta, GA', salary: '$15-18/hr', convictionFriendly: true, matchScore: 0.80 },
      { id: randomUUID(), employer: 'FedEx Ground', title: 'Package Handler', location: 'Atlanta, GA', salary: '$16-20/hr', convictionFriendly: true, matchScore: 0.78 },
    ],
  });
}
