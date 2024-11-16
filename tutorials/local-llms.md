If you want to experiment with local llms.

Try to check the web/lib/models.ts

please do not ask for support on this, except if its to submit a pull request.

we use two env var to decide on the model

MODEL_NAME
VISON_MODEL

---

we have limited ollama support at the moment.

what does that mean:
## Chat
- [x] llama 3.2 support in chat (doesn't require any server change)
- [ ] support for "tool" call

why no tool call:
we have a bunch of "tool calls that we make to fetch youtube transcripts, filter latest files etc, this is not supported right now) because we couldn't get it to behave well with tool calling.

## Organizer

**No support at all right now**

not tested

-----

## Possible solutions 

If someone is interest on developing a solution. I would be happy to point you in right direction. I have a couple ideas, but all of them require some effort.

