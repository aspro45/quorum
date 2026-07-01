# Quorum

Grant decisions with a public rubric and an on-chain review trail.

Quorum is designed for treasury-style allocation: proposals enter with milestones, source material and a review rubric, then GenLayer evaluates the record before funds or status move forward. The project keeps the proposal history readable so reviewers can inspect why a decision was made instead of only seeing the final state.

## Why It Exists

Most grant demos stop at "submit proposal". Quorum carries the rest of the work:

- Rubric configuration before proposals are judged.
- Milestones attached to each request.
- Evidence from docs, repos or public pages.
- Review opening and challenge handling.
- Read endpoints for recent, filtered and detailed proposal views.

## Deployed Instance

| Item | Detail |
| --- | --- |
| App | https://quorum-github.vercel.app |
| Repository | https://github.com/aspro45/quorum |
| Network | GenLayer Studionet |
| Contract | [`0x76cd3670fCcF415B78E8f43C580ef21A7dd419b4`](https://explorer-studio.genlayer.com/contracts/0x76cd3670fCcF415B78E8f43C580ef21A7dd419b4) |
| Deploy tx | [`0xd7fdc8a0f560cd1e54ed13c908efc0f8dd5cdef8dd9663ff075a5588fda85a4e`](https://explorer-studio.genlayer.com/tx/0xd7fdc8a0f560cd1e54ed13c908efc0f8dd5cdef8dd9663ff075a5588fda85a4e) |
| Deployed | 2026-06-23T21:24:32.567Z |

## Contract Shape

- Source: `contracts/quorum_v2.py`
- Size: 40,500 bytes
- Smoke writes: 16 finalized transactions
- Read surface: proposal counts, rubric, treasury, individual proposals, proposal records and recent proposal lists
- GenLayer usage: web evidence rendering, LLM review and validator-comparative consensus

The core flow is rubric -> proposal -> milestones -> evidence -> review -> challenge or archive.

## Smoke Trail

| Step | Transaction |
| --- | --- |
| `set_rubric` | [0x18e05870...182bcc](https://explorer-studio.genlayer.com/tx/0x18e05870f5795abc8c8bc553206b5475a3d0df47629ecf25ba38b08422182bcc) |
| `draft_proposal` | [0x18510d36...41522c](https://explorer-studio.genlayer.com/tx/0x18510d36ade812aea3d680edbd806f92de059ddaad9649a06a78e7c45141522c) |
| `add_milestone` | [0x20e60a3a...7e092f](https://explorer-studio.genlayer.com/tx/0x20e60a3a23ecfc20e072247770a21e77dec9cf0f022ff775111d79ff2d7e092f) |
| `add_evidence_docs` | [0x81315882...97094e](https://explorer-studio.genlayer.com/tx/0x813158826f44fe4bc35a3825431fdfb9467d1e5389660e9c7c4133063f97094e) |
| `add_evidence_github` | [0xb6152a48...13886c](https://explorer-studio.genlayer.com/tx/0xb6152a48d9bcf42a1f2063c30682c4d1ab3fc5824cf3dc55f18e73a62f13886c) |
| `open_review` | [0xf33c6a9e...f43da3](https://explorer-studio.genlayer.com/tx/0xf33c6a9efc2d2ba992fe1f12f195ed51b8f96b8b21f5abbfb5a8a35e60f43da3) |

## Local Preview

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Publishing Hygiene

The public repository should stay limited to the app, contract source and deployment records. Do not commit decrypted keys, `.env` files, `.vercel/`, local vaults or dashboard exports.
