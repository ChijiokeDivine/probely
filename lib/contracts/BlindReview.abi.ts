import type { Abi } from 'viem';

export const BlindReviewAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidKMSSignatures",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "handle",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "SenderNotAllowedToUseHandle",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZamaProtocolUnsupported",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum BlindReview.AutoAdvanceAction",
        "name": "action",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "weightedScore",
        "type": "uint32"
      }
    ],
    "name": "AutoAdvanceTriggered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "oldDeadline",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newDeadline",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "admin",
        "type": "address"
      }
    ],
    "name": "DeadlineExtended",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32[]",
        "name": "handlesList",
        "type": "bytes32[]"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "abiEncodedCleartexts",
        "type": "bytes"
      }
    ],
    "name": "PublicDecryptionVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32[10]",
        "name": "handles",
        "type": "bytes32[10]"
      }
    ],
    "name": "RevealRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumProblemSolving",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumTechnicalDepth",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumCommunication",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumCollaboration",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumCultureGrowth",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumSqProblemSolving",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumSqTechnicalDepth",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumSqCommunication",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumSqCollaboration",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "sumSqCultureGrowth",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reviewerCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8[8]",
        "name": "tagCounts",
        "type": "uint8[8]"
      }
    ],
    "name": "Revealed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "admin",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "submittedCountAtCancellation",
        "type": "uint8"
      }
    ],
    "name": "ReviewCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "admin",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "candidateRef",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "role",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "roundNumber",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reviewerCount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "ReviewCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldReviewer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newReviewer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "admin",
        "type": "address"
      }
    ],
    "name": "ReviewerReplaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "reviewer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "submittedCount",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reviewerCount",
        "type": "uint256"
      }
    ],
    "name": "ScoreSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BASIS_POINTS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CATEGORY_COUNT",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_EXTENSION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_REVIEWERS",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_ROUNDS_PER_CANDIDATE",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_DEADLINE_GAP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_REVIEWERS",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "NUM_TAGS",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "cancelReview",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "confidentialProtocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "candidateRef",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "role",
        "type": "string"
      },
      {
        "internalType": "address[]",
        "name": "reviewerList",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint16",
            "name": "problemSolving",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "technicalDepth",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "communication",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "collaboration",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "cultureGrowth",
            "type": "uint16"
          }
        ],
        "internalType": "struct BlindReview.CategoryWeights",
        "name": "weights",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bool",
            "name": "enabled",
            "type": "bool"
          },
          {
            "internalType": "uint32",
            "name": "passThreshold",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "failThreshold",
            "type": "uint32"
          },
          {
            "internalType": "enum BlindReview.AutoAdvanceAction",
            "name": "passAction",
            "type": "uint8"
          },
          {
            "internalType": "enum BlindReview.AutoAdvanceAction",
            "name": "failAction",
            "type": "uint8"
          }
        ],
        "internalType": "struct BlindReview.AutoAdvanceRule",
        "name": "advanceRule",
        "type": "tuple"
      }
    ],
    "name": "createReview",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "newDeadline",
        "type": "uint256"
      }
    ],
    "name": "extendDeadline",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "getAutoAdvanceRule",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "enabled",
            "type": "bool"
          },
          {
            "internalType": "uint32",
            "name": "passThreshold",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "failThreshold",
            "type": "uint32"
          },
          {
            "internalType": "enum BlindReview.AutoAdvanceAction",
            "name": "passAction",
            "type": "uint8"
          },
          {
            "internalType": "enum BlindReview.AutoAdvanceAction",
            "name": "failAction",
            "type": "uint8"
          }
        ],
        "internalType": "struct BlindReview.AutoAdvanceRule",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "candidateRef",
        "type": "string"
      }
    ],
    "name": "getCandidateRounds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "getCategoryWeights",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint16",
            "name": "problemSolving",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "technicalDepth",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "communication",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "collaboration",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "cultureGrowth",
            "type": "uint16"
          }
        ],
        "internalType": "struct BlindReview.CategoryWeights",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "getMyTagMask",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "getRevealHandles",
    "outputs": [
      {
        "internalType": "bytes32[10]",
        "name": "",
        "type": "bytes32[10]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "getRevealedScores",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "sumProblemSolving",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumTechnicalDepth",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumCommunication",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumCollaboration",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumCultureGrowth",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumSqProblemSolving",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumSqTechnicalDepth",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumSqCommunication",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumSqCollaboration",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "sumSqCultureGrowth",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "reviewerCount",
        "type": "uint256"
      },
      {
        "internalType": "uint8[8]",
        "name": "tagCounts",
        "type": "uint8[8]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "getReviewSummary",
    "outputs": [
      {
        "internalType": "address",
        "name": "admin",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "candidateRef",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "role",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "roundNumber",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "reviewerCount",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "submittedCount",
        "type": "uint8"
      },
      {
        "internalType": "enum BlindReview.ReviewStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "extensionUsed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "getReviewers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasReviewerSubmitted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "isInvitedReviewer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextReviewId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "oldReviewer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "newReviewer",
        "type": "address"
      }
    ],
    "name": "replaceReviewer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      }
    ],
    "name": "requestReveal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "abiEncodedClearValues",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "decryptionProof",
        "type": "bytes"
      }
    ],
    "name": "submitRevealedScores",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "reviewId",
        "type": "uint256"
      },
      {
        "internalType": "externalEuint16",
        "name": "problemSolving",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint16",
        "name": "technicalDepth",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint16",
        "name": "communication",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint16",
        "name": "collaboration",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint16",
        "name": "cultureGrowth",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      },
      {
        "internalType": "uint8",
        "name": "tagMask",
        "type": "uint8"
      }
    ],
    "name": "submitScores",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const satisfies Abi;
