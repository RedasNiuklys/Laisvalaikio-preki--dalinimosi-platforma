using System;
using System.Collections.Generic;

namespace Server.DataTransferObjects
{
    public class ChatResponseDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public bool IsGroupChat { get; set; }
        public DateTime CreatedAt { get; set; }
        public MessageDto? LastMessage { get; set; }
        public List<ParticipantDto> Participants { get; set; } = new();
    }

    public class MessageDto
    {
        public string Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public UserDto Sender { get; set; } = new();
    }

    public class ParticipantDto
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime JoinedAt { get; set; }
    }

    public class MessageResponseDto
    {
        public string Id { get; set; }
        public string Content { get; set; }
        public string SentAt { get; set; }  // Using string to maintain ISO 8601 format
        public UserDto Sender { get; set; }
        public List<ReadReceiptDto> ReadBy { get; set; }
    }

    public class ReadReceiptDto
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime ReadAt { get; set; }
    }

    public class CreateChatRequest
    {
        public string? Name { get; set; }
        public bool IsGroupChat { get; set; }
        public List<string> ParticipantIds { get; set; } = new();
    }

    public class UpdateParticipantsRequest
    {
        public List<string>? ParticipantsToAdd { get; set; }
        public List<string>? ParticipantsToRemove { get; set; }
    }
}