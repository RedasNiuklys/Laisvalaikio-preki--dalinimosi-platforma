using System;

namespace Server.DataTransferObjects
{
    public class ChatResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsGroupChat { get; set; }
        public DateTime CreatedAt { get; set; }
        public MessageDto LastMessage { get; set; }
        public List<ParticipantDto> Participants { get; set; }
    }

    public class MessageDto
    {
        public string Id { get; set; }
        public string Content { get; set; }
        public DateTime SentAt { get; set; }
        public UserDto Sender { get; set; }
    }

    public class ParticipantDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string AvatarUrl { get; set; }
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
        public string Id { get; set; }
        public string Name { get; set; }
        public DateTime ReadAt { get; set; }
    }
}