import type { Project } from "./types";

export const INIT_PROJECTS: Project[] = [
  {
    id:"proj-1", name:"QualifyMe", color:"#6366f1", description:"Candidate assessment platform", createdAt:"2024-01-01",
    releaseDate:"2024-04-15",
    config:{ modules:["Login","Dashboard","Registration","Profile","Settings","Reports"], sprints:["Sprint 1","Sprint 2","Sprint 3","Sprint 4"], stories:["US-001","US-002","US-003","US-004","US-005"], devs:["Dev - Arjun","Dev - Sara","Dev - Mike"], releases:["R1 - Mar 1","R1 - Mar 15","R2 - Apr 1","R2 - Apr 15"] },
    cases:[
      {id:"TC-001",title:"Login with valid credentials",module:"Login",story:"US-001",sprint:"Sprint 1",status:"Pass",assignee:"Test Engineer",date:"2024-03-01"},
      {id:"TC-002",title:"Login with invalid password",module:"Login",story:"US-001",sprint:"Sprint 1",status:"Pass",assignee:"Test Engineer",date:"2024-03-02"},
      {id:"TC-003",title:"Dashboard loads after login",module:"Dashboard",story:"US-002",sprint:"Sprint 1",status:"Fail",assignee:"Test Engineer",date:"2024-03-03"},
      {id:"TC-004",title:"User registration flow",module:"Registration",story:"US-003",sprint:"Sprint 2",status:"Pass",assignee:"Test Engineer",date:"2024-03-05"},
      {id:"TC-005",title:"Profile update saves correctly",module:"Profile",story:"US-004",sprint:"Sprint 2",status:"Blocked",assignee:"Test Engineer",date:"2024-03-06"},
      {id:"TC-006",title:"Settings page renders",module:"Settings",story:"US-002",sprint:"Sprint 2",status:"Retest",assignee:"Test Engineer",date:"2024-03-07"},
      {id:"TC-007",title:"Reports export as PDF",module:"Reports",story:"US-005",sprint:"Sprint 3",status:"Pass",assignee:"Test Engineer",date:"2024-03-08"},
      {id:"TC-008",title:"Password reset flow",module:"Login",story:"US-001",sprint:"Sprint 3",status:"Pass",assignee:"Test Engineer",date:"2024-03-09"},
      {id:"TC-009",title:"Dashboard widget click",module:"Dashboard",story:"US-002",sprint:"Sprint 3",status:"Fail",assignee:"Test Engineer",date:"2024-03-10"},
      {id:"TC-010",title:"Bulk user import",module:"Registration",story:"US-003",sprint:"Sprint 4",status:"Not Run",assignee:"Test Engineer",date:"2024-03-12"},
    ],
    bugs:[
      {id:"BUG-001",title:"Dashboard crashes on load",module:"Dashboard",linkedTC:"TC-003",severity:"Critical",priority:"P1 - Urgent",status:"Closed",assignedDev:"Dev - Arjun",reportedDate:"2024-03-03",closedDate:"2024-03-05",reopened:false,release:"R1 - Mar 15"},
      {id:"BUG-002",title:"Profile avatar not saving",module:"Profile",linkedTC:"TC-005",severity:"Major",priority:"P2 - High",status:"Reopened",assignedDev:"Dev - Sara",reportedDate:"2024-03-06",closedDate:"2024-03-08",reopened:true,release:"R1 - Mar 15"},
      {id:"BUG-003",title:"Settings tab freezes on Safari",module:"Settings",linkedTC:"TC-006",severity:"Major",priority:"P2 - High",status:"Retest",assignedDev:"Dev - Mike",reportedDate:"2024-03-07",closedDate:"",reopened:false,release:"R2 - Apr 1"},
      {id:"BUG-004",title:"PDF export missing headers",module:"Reports",linkedTC:"TC-007",severity:"Minor",priority:"P3 - Medium",status:"Open",assignedDev:"Dev - Arjun",reportedDate:"2024-03-08",closedDate:"",reopened:false,release:"R2 - Apr 1"},
      {id:"BUG-005",title:"Dashboard widget not clickable",module:"Dashboard",linkedTC:"TC-009",severity:"Critical",priority:"P1 - Urgent",status:"In Progress",assignedDev:"Dev - Sara",reportedDate:"2024-03-10",closedDate:"",reopened:false,release:"R2 - Apr 15"},
    ]
  },
  {
    id:"proj-2", name:"HireTrack", color:"#06b6d4", description:"Recruitment management system", createdAt:"2024-02-01",
    releaseDate:"2024-05-01",
    config:{ modules:["Jobs","Candidates","Interviews","Offers","Onboarding"], sprints:["Sprint 1","Sprint 2","Sprint 3"], stories:["US-101","US-102","US-103"], devs:["Dev - Priya","Dev - Tom"], releases:["R1 - Apr 1","R1 - Apr 15"] },
    cases:[
      {id:"TC-001",title:"Post a new job listing",module:"Jobs",story:"US-101",sprint:"Sprint 1",status:"Pass",assignee:"Test Engineer",date:"2024-04-01"},
      {id:"TC-002",title:"Filter candidates by skill",module:"Candidates",story:"US-102",sprint:"Sprint 1",status:"Fail",assignee:"Test Engineer",date:"2024-04-02"},
      {id:"TC-003",title:"Schedule interview slot",module:"Interviews",story:"US-103",sprint:"Sprint 2",status:"Pass",assignee:"Test Engineer",date:"2024-04-03"},
      {id:"TC-004",title:"Send offer letter",module:"Offers",story:"US-102",sprint:"Sprint 2",status:"Not Run",assignee:"Test Engineer",date:"2024-04-04"},
    ],
    bugs:[
      {id:"BUG-001",title:"Candidate filter returns empty results",module:"Candidates",linkedTC:"TC-002",severity:"Critical",priority:"P1 - Urgent",status:"Open",assignedDev:"Dev - Priya",reportedDate:"2024-04-02",closedDate:"",reopened:false,release:"R1 - Apr 1"},
      {id:"BUG-002",title:"Interview calendar overlaps slots",module:"Interviews",linkedTC:"TC-003",severity:"Minor",priority:"P3 - Medium",status:"In Progress",assignedDev:"Dev - Tom",reportedDate:"2024-04-03",closedDate:"",reopened:false,release:"R1 - Apr 15"},
    ]
  }
];
