# API Endpoints Documentation

## Admin Blog Management Endpoints

### GET /api/admin/blogs
Get all blogs for admin (all statuses)

**Query Parameters:**
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of blogs per page (default: 10)
- `status` (string, optional): Filter by status ('pending', 'approved', 'rejected')
- `author` (string, optional): Filter by author ID
- `search` (string, optional): Search in title and content

**Response:**
```json
{
  "data": {
    "blogs": [
      {
        "_id": "string",
        "title": "string",
        "slug": "string",
        "content": "string",
        "coverImage": "string",
        "author": {
          "_id": "string",
          "email": "string"
        },
        "likes": ["string"],
        "dislikes": ["string"],
        "status": "pending" | "approved" | "rejected",
        "approvedBy": {
          "_id": "string",
          "email": "string"
        },
        "approvedAt": "Date",
        "isPublished": boolean,
        "publishedAt": "Date",
        "createdAt": "Date",
        "updatedAt": "Date"
      }
    ],
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "pages": number
    },
    "statusCounts": [
      {
        "_id": "pending",
        "count": number
      },
      {
        "_id": "approved", 
        "count": number
      },
      {
        "_id": "rejected",
        "count": number
      }
    ]
  }
}
```

### PUT /api/admin/blogs/[id]/approve
Approve a blog post

**Response:**
```json
{
  "_id": "string",
  "title": "string",
  "slug": "string",
  "content": "string",
  "coverImage": "string",
  "author": "string",
  "likes": ["string"],
  "dislikes": ["string"],
  "status": "approved",
  "approvedBy": "string",
  "approvedAt": "Date",
  "isPublished": boolean,
  "publishedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### PUT /api/admin/blogs/[id]/reject
Reject a blog post

**Response:**
```json
{
  "_id": "string",
  "title": "string",
  "slug": "string",
  "content": "string",
  "coverImage": "string",
  "author": "string",
  "likes": ["string"],
  "dislikes": ["string"],
  "status": "rejected",
  "approvedBy": "string",
  "approvedAt": "Date",
  "isPublished": boolean,
  "publishedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### GET /api/admin/blogs/stats
Get blog statistics

**Response:**
```json
{
  "totalBlogs": number,
  "pendingBlogs": number,
  "approvedBlogs": number,
  "rejectedBlogs": number,
  "publishedBlogs": number,
  "blogsByMonth": [
    {
      "month": "string",
      "count": number
    }
  ]
}
```

### GET /api/blogs/[id]
Get a single blog post by ID

**Response:**
```json
{
  "_id": "string",
  "title": "string",
  "slug": "string",
  "content": "string",
  "coverImage": "string",
  "author": "string",
  "likes": ["string"],
  "dislikes": ["string"],
  "status": "pending" | "approved" | "rejected",
  "approvedBy": "string",
  "approvedAt": "Date",
  "isPublished": boolean,
  "publishedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### DELETE /api/admin/blogs/[id]
Delete a blog post

**Response:**
```json
{
  "message": "Blog deleted successfully"
}
```

### POST /api/admin/blogs
Create a new blog post

**Request Body:**
```json
{
  "title": "string",
  "content": "string",
  "coverImage": "string (optional)",
  "isPublished": boolean (optional, default: false)
}
```

**Response:**
```json
{
  "_id": "string",
  "title": "string",
  "slug": "string",
  "content": "string",
  "coverImage": "string",
  "author": "string",
  "likes": ["string"],
  "dislikes": ["string"],
  "status": "pending",
  "approvedBy": null,
  "approvedAt": null,
  "isPublished": boolean,
  "publishedAt": null,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### PUT /api/admin/blogs/[id]
Update a blog post

**Request Body:**
```json
{
  "title": "string (optional)",
  "content": "string (optional)",
  "coverImage": "string (optional)",
  "isPublished": boolean (optional)
}
```

**Response:**
```json
{
  "_id": "string",
  "title": "string",
  "slug": "string",
  "content": "string",
  "coverImage": "string",
  "author": "string",
  "likes": ["string"],
  "dislikes": ["string"],
  "status": "pending" | "approved" | "rejected",
  "approvedBy": "string",
  "approvedAt": "Date",
  "isPublished": boolean,
  "publishedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### POST /api/admin/blogs/upload-image
Upload blog cover image

**Request:**
- Content-Type: multipart/form-data
- Body: image file

**Response:**
```json
{
  "url": "string",
  "filename": "string",
  "size": number
}
```

## Blog Schema

```typescript
interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string;
  author: IUser['_id'];
  likes: IUser['_id'][];
  dislikes: IUser['_id'][];
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: IUser['_id'];
  approvedAt?: Date;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Authentication

All admin endpoints require authentication with a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions (admin role required)
- `404 Not Found`: Blog not found
- `500 Internal Server Error`: Server error

Example error response:
```json
{
  "error": "string",
  "message": "string",
  "statusCode": number
}
```
---

## Agent Profile Endpoints

An agent's public-facing business profile lives in its own `AgentProfile`
collection, keyed by `userId`. It is created automatically the first time the
agent opens `GET /api/agent/profile/status`.

**Completion weighting** (`profileCompletionPercentage`, 0-100):

| Step | Flag | Weight |
| --- | --- | --- |
| Basic information | `basicInfo` | 25 |
| Business details | `businessDetails` | 25 |
| Service categories | `categorySelected` | 20 |
| Documents | `documentsUploaded` | 15 |
| Admin approval | `adminApproved` | 15 |

`categorySelected`, `documentsUploaded` and `adminApproved` are **derived**, not
stored independently — they are recomputed from `User.categories`, the uploaded
document count, and `status` on every read and write.

**Service categories are NOT stored on the profile.** They live on
`User.categories`, capped by the agent's subscription `categoryLimit`, and are
edited through the existing `PUT /api/profile`. The profile only mirrors the
completion flag.

**Statuses:** `incomplete` → `pending` → `approved` | `rejected`. An `approved`
profile is what makes the agent publicly visible; there is no separate `live`
state. While a profile is `pending`, every agent write endpoint returns `409
UNDER_REVIEW` so an admin isn't reviewing a moving target. Editing a `rejected`
profile returns it to `incomplete` so it can be resubmitted.

### GET /api/agent/profile/status
Current agent's profile and completion state. Creates an empty profile on first
call. Document `fileUrl`s come back as signed Cloudinary URLs.

Auth: agent.

### POST /api/agent/profile/basic-info
Step 1. Body: `companyName`, `ownerName`, `phone`, `whatsapp`, `email`,
`website` (optional), `businessLocation`, `city`, `province`, `officeAddress`.

Phone and WhatsApp must be Pakistani format (`+923XXXXXXXXX` or `03XXXXXXXXX`);
spaces and dashes are stripped before validation. `email` must not already be in
use by a different agent profile.

Auth: agent. Returns the refreshed `{ profileCompletionPercentage,
profileCompletion, status }`.

### POST /api/agent/profile/business-details
Step 2. Body: `companyDescription` (100-1000 chars), `yearsExperience` (integer
0-100), `servicesOffered` (10-500 chars), `areaServed` (1-20 strings),
`socialMedia` (optional `facebook`/`instagram`/`linkedin`/`twitter` URLs).

Returns `400 STEP_OUT_OF_ORDER` if basic info hasn't been saved yet.

Auth: agent.

### POST /api/agent/profile/documents/upload
Step 4. `multipart/form-data` with `file` and `documentName`.

- `file`: PDF, JPG or PNG, max 10 MB. Max 10 documents per profile.
- `documentName`: 3-100 chars, letters/numbers/spaces/hyphens/periods.

Files are stored as **private Cloudinary assets** (`type: authenticated`) under
`bookmyagent/agent-verification`. The stored URL is not directly viewable — a
signed URL is minted at read time and only returned to the owning agent and to
admins. If the database write fails, the uploaded asset is deleted.

Auth: agent.

### DELETE /api/agent/profile/documents/:documentId
Removes one of the agent's own documents, then deletes the Cloudinary asset.

Auth: agent.

### POST /api/agent/profile/submit-for-review
Moves the profile to `pending`. Requires `basicInfo`, `businessDetails` and
`categorySelected`; documents are recommended but not required, so a profile can
be submitted at 70%. Clears any previous rejection.

Returns `400 INCOMPLETE_PROFILE` with a `missingFields` array if a required step
is outstanding, or `409` if already submitted or approved.

Auth: agent.

### GET /api/agents/:id
**Public.** Approved profiles only; accepts either the `AgentProfile` id or the
agent's user id. Anything not approved — or an agent whose account is
deactivated — answers `404` exactly as a non-existent agent would, so the
endpoint never reveals that an unapproved agent exists. Verification documents
and admin notes are never included.

Auth: none.

---

## Admin Agent Approval Endpoints

### GET /api/admin/agents
List agent profiles for review.

**Query Parameters:**
- `status`: `pending` (default) | `approved` | `rejected` | `incomplete` | `all`
- `search`: matches company name, owner name or email
- `sortBy`: `createdAt` | `updatedAt` | `submittedForReviewAt` (default) | `companyName` | `profileCompletionPercentage`
- `order`: `asc` | `desc` (default)
- `page`, `limit` (default 20, max 100)

Returns `{ agents, pagination, filters }`, where `filters` holds the count per
status for the tab badges.

Auth: admin.

### GET /api/admin/agents/:agentId
Full profile for review, including signed document URLs and an `account` block
with the underlying user record. `:agentId` is the `AgentProfile` id.

Auth: admin.

### POST /api/admin/agents/:agentId/approve
Body: `adminNotes` (optional, shown to the agent only).

Sets `approved`, stamps `approvedAt`/`approvedBy`, marks any still-pending
documents approved, and takes completion to 100%. Returns `409` if already
approved.

Auth: admin.

### POST /api/admin/agents/:agentId/reject
Body: `rejectionReason` (**required**), `rejectionReasonDetails` (optional),
`adminNotes` (optional), `specificDocumentIssues` (optional array of
`{ documentId, issue }` — marks individual documents rejected with a note).

The agent sees the reason, can edit, and can resubmit.

Auth: admin.
