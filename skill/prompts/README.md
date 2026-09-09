# Prompts for travelers

Paste one of these into your coding agent (Claude Code, Codex CLI, or another agent that reads `AGENTS.md` / `SKILL.md`). Replace the angle-bracket parts. Short prompts work better than long ones: the skill knows the pipeline; you supply the trip.

## P01 · Start a roadbook from my materials

~~~text
Build my travel roadbook with the travel skill.
Materials are in input/. Destination: <country / cities>. Dates: <start – end>. Travelers: <how many, any kids>.
Read the materials, fill trip/travel-data.json, then run the gap report and ask me the open questions in one batch.
Do not invent times, prices or booking status.
~~~

## P02 · Answer the gaps

~~~text
Answers to your gap list:
1. <answer>  2. <answer>  3. leave unknown
Update the data, run the validator, and start the preview.
~~~

## P03 · Facts vs. suggestions

~~~text
The flights and the first two hotels are booked; everything else is planned, not booked.
The blog links in input/ are suggestions only — keep them out of the day plan unless I chose them.
~~~

## P04 · Choose a look

~~~text
Show me the same trip in the three themes (field-notes, timetable, tide) and tell me which one you would pick for <mood: quiet / practical / playful> and why.
Then apply the one I choose. Do not add images yet.
~~~

## P05 · One small change

~~~text
Move <activity> from <day> to <day>, and mark the Berlin hotel as booked (confirmation is in input/hotel-berlin.pdf — record the fact, not the number).
Validate and reload the preview.
~~~

## P06 · Check before I share it

~~~text
I want to share this with the people I travel with.
Run the build and the release check. Then read trip/travel-data.json yourself and list anything you think I might not want public (addresses, names, prices), one line each. I will decide.
~~~

## P07 · Publish

~~~text
Publish dist/ to <GitHub Pages / Netlify / my own server>. Use the instructions in docs/PUBLISHING.md.
Before you push or upload anything, show me exactly what will be public and wait for my OK.
~~~

## P08 · Update after the trip changed

~~~text
The trip changed: <what changed>. Update the data, run the gap report again (only tell me new gaps), rebuild, and tell me what to re-check on the live site.
~~~

## For maintainers · make the skill judge itself

~~~text
Read skill/SKILL.md and skill/references/scenarios.md. Take scenario <letter>. Do not read any other file in skill/evals/.
Write what you would do next, which files you would change, and what you would refuse or ask. Stop there.
~~~
