// Node 18+ only

const API_KEY = "k-proj-02rxbMqolR_P6j-xIWJhBjslDtsjit5sc_KQs-RKL2L9yV1f6lY_knRJd_XeJlkgELdu8cMigyT3BlbkFJg0MghH4NYF6k-_KTg83UCOJ-xlHHL5yLvEEtMU7XxptHfCKSBt4za09wcsDDQmaKwIBxTibfEA";

if (!API_KEY) {
  throw new Error("OPENAI_API_KEY not set");
}

const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-4.1-mini",
    input: "Say hello in one sentence."
  })
});

const data = await response.json();

console.log("Status:", response.status);
console.log(data);
