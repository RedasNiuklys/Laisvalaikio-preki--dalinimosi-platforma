using AutoMapper;
using Server.DataTransferObjects;
using Server.Models;

namespace Server.MappingProfiles
{
    public class LocationProfile : Profile
    {
        public LocationProfile()
        {
            // Location -> LocationResponseDto
            CreateMap<Location, LocationResponseDto>();

            // CreateLocationDto -> Location
            CreateMap<CreateLocationDto, Location>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());

            // UpdateLocationDto -> Location
            // Note: For partial updates, map manually in controller to handle null values
            CreateMap<UpdateLocationDto, Location>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());
        }
    }
}

