export default (request, context) => {
  try {
    const { user, receipt, amount } = context.params;

    return new Response(
      JSON.stringify({
        message: `${user} envoie ${amount} F CFA au ${receipt}!`,
      }),
      {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    );
  } catch (error) {
    return new Response(error.toString(), {
      status: 500,
    });
  }
};

export const config = {
  path: "/:user/:receipt/:amount",
};
