export type RecruiterState = {
  code: string;
  url: string;
  uses: number;
  required: number;
  granted: boolean;
};

export async function getMyInvite(): Promise<Omit<RecruiterState, "granted"> & { required: number }> {
  return {
    code: "prophile",
    url: "https://discord.gg/prophile",
    uses: 3,
    required: 5,
  };
}

export async function hasInviteCode(): Promise<boolean> {
  return true;
}

export async function checkRecruiterProgress(): Promise<RecruiterState> {
  return {
    code: "prophile",
    url: "https://discord.gg/prophile",
    uses: 5,
    required: 5,
    granted: true,
  };
}
