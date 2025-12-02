using AutoMapper;
using Server.DataTransferObjects;
using Server.Models;

namespace Server.MappingProfiles
{
    public class BookingProfile : Profile
    {
        public BookingProfile()
        {
            // Booking -> BookingResponseDto
            CreateMap<Booking, BookingResponseDto>()
                .ForMember(dest => dest.Equipment, opt => opt.MapFrom(src => src.Equipment))
                .ForMember(dest => dest.User, opt => opt.MapFrom(src => src.User));

            // CreateBookingDto -> Booking
            CreateMap<CreateBookingDto, Booking>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => BookingStatus.Planning))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Equipment, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());

            // ApplicationUser -> UserResponseDto
            CreateMap<ApplicationUser, UserResponseDto>();
        }
    }
}

