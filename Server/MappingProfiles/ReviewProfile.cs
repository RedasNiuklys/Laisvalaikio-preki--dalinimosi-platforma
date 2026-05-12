using AutoMapper;
using Server.DataTransferObjects;
using Server.Models;

namespace Server.MappingProfiles
{
    public class ReviewProfile : Profile
    {
        public ReviewProfile()
        {
            CreateMap<Review, ReviewResponseDto>()
                .ForMember(dest => dest.Reviewer, opt => opt.MapFrom(src => src.User));

            CreateMap<CreateReviewDto, Review>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Equipment, opt => opt.Ignore())
                .ForMember(dest => dest.Booking, opt => opt.Ignore());
        }
    }
}
