Capabilities
OpenAI compatibility
Use the SambaNova Cloud API with OpenAI’s client libraries to easily upgrade your existing applications to use the fastest inference on the best open source models!

​
Download the library
Run the command below to download the library.

pip install openai
​
Use SambaNova APIs with OpenAI client libraries
Switching to SambaNova APIs with OpenAI’s client libraries is as simple as setting two values, as shown below. Start a new file and create the client variable by passing the base_url and api_key. The api_key should be saved in a secure location.

Set the base_url to the “https://api.sambanova.ai/v1”.

Set the api_key to the "YOUR SAMBANOVA CLOUD API KEY".

Don’t have a SambaNova Cloud API key? Get yours from the SambaNova Cloud portal.

from openai import OpenAI

client = OpenAI(
base_url="https://api.sambanova.ai/v1",
api_key="YOUR SAMBANOVA CLOUD API KEY"
)
Now you can make an API request to a model and choose how to receive your output.

​
Non-streaming example
The following code demonstrates using the OpenAI python client for non-streaming completions.

completion = client.chat.completions.create(
model="Meta-Llama-3.1-8B-Instruct",
messages = [
{"role": "system", "content": "Answer the question in a couple sentences."},
{"role": "user", "content": "Share a happy story with me"}
]
)

print(completion.choices[0].message)
​
Streaming example
The following code demonstrates using the OpenAI python client for streaming completions.

completion = client.chat.completions.create(
model="Meta-Llama-3.1-8B-Instruct",
messages = [
{"role": "system", "content": "Answer the question in a couple sentences."},
{"role": "user", "content": "Share a happy story with me"}
],
stream= True
)

for chunk in completion:
print(chunk.choices[0].delta.content)
​
Unsupported OpenAI features
The following features are not yet supported and will be ignored:

logprobs

top_logprobs

n

presence_penalty

frequency_penalty

logit_bias

seed

​
Feature differences
temperature: The SambaNova Cloud API supports a value between 0 and 1.

​
Features unsupported by OpenAI clients
The SambaNova API supports the top_k parameter. This is not supported by the OpenAI client.

Rate limits
Text generation
