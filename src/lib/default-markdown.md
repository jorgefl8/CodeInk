# Welcome to CodeInk

A real-time **Markdown editor** with syntax highlighting, diagrams and math.

---

## Code Highlighting

```typescript
interface User {
  id: string
  name: string
  email: string
}

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error("User not found")
  return res.json()
}
```

```python
def fibonacci(n: int) -> list[int]:
    """Generate fibonacci sequence"""
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

print(fibonacci(10))
```

```bash
#!/bin/bash
# Deploy script
echo "🚀 Building project..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful, deploying..."
  rsync -avz --delete ./dist/ user@server:/var/www/app/
  echo "🎉 Deployed!"
else
  echo "❌ Build failed" && exit 1
fi
```

```sql
-- Get top users by activity
SELECT
    u.name,
    u.email,
    COUNT(p.id) AS total_posts,
    MAX(p.created_at) AS last_post
FROM users u
LEFT JOIN posts p ON p.author_id = u.id
WHERE u.active = true
GROUP BY u.id, u.name, u.email
HAVING COUNT(p.id) > 5
ORDER BY total_posts DESC
LIMIT 10;
```

```go
package main

import (
	"fmt"
	"net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
	http.HandleFunc("/", handler)
	fmt.Println("Server running on :8080")
	http.ListenAndServe(":8080", nil)
}
```

```java
import java.util.List;
import java.util.stream.Collectors;

public class App {
    record User(String name, int age) {}

    public static void main(String[] args) {
        var users = List.of(
            new User("Alice", 30),
            new User("Bob", 25),
            new User("Charlie", 35)
        );

        var adults = users.stream()
            .filter(u -> u.age() >= 30)
            .map(User::name)
            .collect(Collectors.toList());

        System.out.println("Adults: " + adults);
    }
}
```

## Math with KaTeX

Inline math: $E = mc^2$

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## GitHub Alerts

> [!TIP]
> Use keyboard shortcuts to speed up your workflow.

> [!WARNING]
> This is a client-side only application. Your content is not saved to any server.

> [!NOTE]
> CodeInk supports all GitHub Flavored Markdown features.

## Tables

| Feature | Status |
|---------|--------|
| Syntax Highlighting | Shiki |
| Diagrams | Mermaid |
| Math | KaTeX |
| Alerts | GitHub-style |
| Footnotes | Supported |

## Task List

- [x] Markdown rendering
- [x] Shiki syntax highlighting
- [x] Mermaid diagrams
- [x] KaTeX math
- [ ] Export to PDF
- [ ] Collaborative editing

## Footnotes

CodeInk uses marked[^1] for parsing and Shiki[^2] for syntax highlighting.

[^1]: [marked](https://marked.js.org/) - A markdown parser built for speed.
[^2]: [Shiki](https://shiki.style/) - A beautiful syntax highlighter.

---

## Mermaid Diagrams

### Flowchart

```mermaid
graph TD
    A[Write Markdown] --> B[Live Preview]
    B --> C{Looks good?}
    C -->|Yes| D[Share it!]
    C -->|No| A
```

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant DB as Database

    U->>C: Submit form
    C->>S: POST /api/data
    S->>DB: INSERT query
    DB-->>S: Success
    S-->>C: 201 Created
    C-->>U: Show confirmation
```

### Entity Relationship

```mermaid
erDiagram
    USER ||--o{ POST : writes
    USER ||--o{ COMMENT : makes
    POST ||--o{ COMMENT : has
    POST }o--|| CATEGORY : belongs_to

    USER {
        string id PK
        string name
        string email
    }
    POST {
        string id PK
        string title
        string content
        date created_at
    }
```

### Pie Chart

```mermaid
pie title Tech Stack Distribution
    "Frontend" : 40
    "Backend" : 30
    "DevOps" : 15
    "Testing" : 15
```

### Gantt Chart

```mermaid
gantt
    title Project Timeline 2024
    dateFormat YYYY-MM-DD
    axisFormat %b %d
    tickInterval 1month
    
    section Planning
        Requirements   :a1, 2024-01-01, 30d
        Architecture   :a2, after a1, 21d
    
    section Development
        Backend API    :a3, 2024-02-01, 60d
        Frontend UI    :a4, 2024-02-15, 50d
        Integration    :a5, after a3, 30d
        
    section Testing
        Unit Tests     :a6, 2024-05-01, 30d
        E2E Tests      :a7, after a6, 30d
        
    section Deploy
        Staging        :a8, after a7, 21d
        Production     :milestone, 2024-08-01, 0d
```

### Class Diagram

```mermaid
classDiagram
    class User {
        -String id
        -String email
        -String password
        +login() boolean
        +logout() void
    }
    
    class Post {
        -String id
        -String title
        -String content
        -Date createdAt
        +publish() void
    }
    
    class Comment {
        -String id
        -String text
        -Date createdAt
    }
    
    User "1" --> "*" Post : creates
    User "1" --> "*" Comment : writes
    Post "1" --> "*" Comment : has
```

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Loading : fetch data
    Loading --> Success : data received
    Loading --> Error : network error
    
    Success --> Idle : reset
    Error --> Loading : retry
    Error --> Idle : cancel
    
    state Loading {
        [*] --> Fetching
        Fetching --> Validating
        Validating --> [*]
    }
```

### User Journey

```mermaid
journey
    title User Registration Flow
    
    section Visit Website
        Landing page: 5: User
        Click signup: 4: User
        
    section Registration
        Fill form: 3: User
        Verify email: 2: User, System
        Set password: 4: User
        
    section Onboarding
        Complete profile: 3: User
        Take tutorial: 2: User
        First action: 5: User
```

### Git Graph

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "Add README"
    
    branch develop
    checkout develop
    commit id: "Setup project"
    commit id: "Add config"
    
    checkout main
    branch feature/auth
    checkout feature/auth
    commit id: "Add auth middleware"
    commit id: "Add login endpoint"
    
    checkout develop
    merge feature/auth id: "Merge auth"
    commit id: "Add tests"
    
    checkout main
    merge develop id: "Release v1.0"
    commit id: "Tag v1.0.0"
```

### Mindmap

```mermaid
mindmap
  root((Project))
    Planning
      Requirements
      Architecture
      Timeline
    Development
      Backend
        API
        Database
      Frontend
        UI Components
        State Management
    Testing
      Unit Tests
      Integration
      E2E
    Deployment
      CI/CD
      Monitoring
      Scaling
```

### Timeline

```mermaid
timeline
    title Project Milestones 2024
    
    Q1 : Project Kickoff
       : Team Setup
       : Requirements Gathering
       
    Q2 : MVP Development
       : Alpha Release
       : User Testing
       
    Q3 : Beta Launch
       : Feature Complete
       : Performance Optimization
       
    Q4 : Production Release
       : Marketing Campaign
       : Post-Launch Support
```

### Sankey Diagram

```mermaid
sankey
    %% source,target,value
    Visitors,New Users,450
    Visitors,Returning Users,320
    New Users,Active Users,280
    New Users,Churned,170
    Returning Users,Active Users,290
    Returning Users,Churned,30
    Active Users,Premium,150
    Active Users,Free,420
```

### Block Diagram

```mermaid
block
  columns 1
    db(("DB"))
    blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
    block:ID
      A
      B["A wide one in the middle"]
      C
    end
    space
    D
    ID --> D
    C --> D
    style B fill:#969,stroke:#333,stroke-width:4px
```

### Architecture Diagram

```mermaid
architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db
```

### XY Chart

```mermaid
xychart
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun]
    y-axis "Revenue (in $)" 0 --> 500
    bar [200, 180, 220, 190, 160, 140]
    line [120, 150, 180, 140, 110, 95]
```
