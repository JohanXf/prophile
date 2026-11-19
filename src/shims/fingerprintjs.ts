export async function load() {
  return {
    async get() {
      return {
        visitorId: "prophile-visitor-id",
      };
    },
  };
}

export default {
  load,
};
